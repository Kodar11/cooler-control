import { create } from 'zustand';

import {
  DeviceError,
  deviceService,
  type ConnectionState,
  type DeviceInfo,
  type DeviceStatus,
} from '@/device';
import { clamp } from '@/lib/format';
import { logger, type LogDetails } from '@/logging/logger';

import { showToast } from './toastStore';

const SOURCE = 'store';

/** Roughly five minutes of readings at the device's update rate. */
const HISTORY_LIMIT = 150;
/** Telemetry is logged when it moves, and at least this often when it does not. */
const TELEMETRY_LOG_INTERVAL_MS = 30_000;

export interface TelemetrySample {
  timestamp: number;
  temperature: number;
  humidity: number;
}

type Control = 'fan' | 'pump' | 'cooler';

interface ControlValues {
  fanSpeed: number;
  pumpEnabled: boolean;
  coolerEnabled: boolean;
}

interface DeviceState extends ControlValues {
  connection: ConnectionState;
  deviceInfo: DeviceInfo | null;
  /** A calm, user-facing explanation of the last connection problem. */
  connectionError: string | null;

  /** Sensor readings are `null` whenever there is no live data to show. */
  temperature: number | null;
  humidity: number | null;
  waterLevel: number | null;

  lastUpdated: number | null;
  connectedAt: number | null;
  readingCount: number;
  history: TelemetrySample[];

  initialize: () => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  /** Reflect a fan value in the UI while the user is still dragging; nothing is sent. */
  previewFanSpeed: (percent: number) => void;
  setFanSpeed: (percent: number) => Promise<void>;
  setPump: (enabled: boolean) => Promise<void>;
  setCooler: (enabled: boolean) => Promise<void>;
}

// ── Bookkeeping that the UI never needs to render ────────────────────────────

let initialized = false;
let connectAttempt = 0;
/** Latest command issued per control; older responses are ignored. */
const tickets: Record<Control, number> = { fan: 0, pump: 0, cooler: 0 };
/** Commands awaiting a response. While non-zero, pushed telemetry must not overwrite the control. */
const inFlight: Record<Control, number> = { fan: 0, pump: 0, cooler: 0 };
let scrubbingFan = false;
/** Last control values the device itself confirmed — what a failed command rolls back to. */
let confirmed: ControlValues = { fanSpeed: 0, pumpEnabled: false, coolerEnabled: false };
let lastLogged: { temperature: number; humidity: number; waterLevel: number; at: number } | null = null;

const CLEARED_READINGS = { temperature: null, humidity: null, waterLevel: null } as const;

function isValidStatus(status: DeviceStatus): boolean {
  return (
    Number.isFinite(status.temperature) &&
    Number.isFinite(status.humidity) &&
    Number.isFinite(status.waterLevel) &&
    Number.isFinite(status.fanSpeed) &&
    typeof status.pumpEnabled === 'boolean' &&
    typeof status.coolerEnabled === 'boolean'
  );
}

function describeConnectionFailure(error: unknown): string {
  if (error instanceof DeviceError && error.code === 'TIMEOUT') {
    return "The cooler didn't respond. Check that it's powered on and your phone is on its Wi-Fi network.";
  }
  return "Couldn't reach the cooler. Connect your phone to the cooler's Wi-Fi network and try again.";
}

const errorDetails = (error: unknown): LogDetails =>
  error instanceof DeviceError
    ? { code: error.code, error: error.message }
    : { error: error instanceof Error ? error.message : String(error) };

export const useDeviceStore = create<DeviceState>((set, get) => {
  function logTelemetry(status: DeviceStatus, now: number) {
    const moved =
      !lastLogged ||
      Math.abs(status.temperature - lastLogged.temperature) >= 0.2 ||
      Math.abs(status.humidity - lastLogged.humidity) >= 1 ||
      now - lastLogged.at >= TELEMETRY_LOG_INTERVAL_MS;
    const waterMoved = !lastLogged || Math.abs(status.waterLevel - lastLogged.waterLevel) >= 1;

    if (moved) {
      logger.data(SOURCE, 'Sensor update', { temperature: status.temperature, humidity: status.humidity });
    }
    if (waterMoved) {
      logger.data(SOURCE, 'Water level update', { waterLevel: status.waterLevel });
    }
    if (moved || waterMoved) {
      lastLogged = {
        temperature: moved || !lastLogged ? status.temperature : lastLogged.temperature,
        humidity: moved || !lastLogged ? status.humidity : lastLogged.humidity,
        waterLevel: waterMoved || !lastLogged ? status.waterLevel : lastLogged.waterLevel,
        at: moved || !lastLogged ? now : lastLogged.at,
      };
    }
  }

  /** Merge a status snapshot from the device into app state. */
  function applyStatus(status: DeviceStatus) {
    if (!isValidStatus(status)) {
      logger.warn(SOURCE, 'Unexpected status payload ignored', { payload: JSON.stringify(status) });
      return;
    }

    const now = Date.now();
    const state = get();

    const reported: ControlValues = {
      fanSpeed: clamp(Math.round(status.fanSpeed), 0, 100),
      pumpEnabled: status.pumpEnabled,
      coolerEnabled: status.coolerEnabled,
    };
    if (
      reported.fanSpeed !== confirmed.fanSpeed ||
      reported.pumpEnabled !== confirmed.pumpEnabled ||
      reported.coolerEnabled !== confirmed.coolerEnabled
    ) {
      logger.info(SOURCE, 'Device state changed', {
        cooler: reported.coolerEnabled ? 'on' : 'off',
        pump: reported.pumpEnabled ? 'on' : 'off',
        fanSpeed: reported.fanSpeed,
      });
    }
    confirmed = reported;

    // A control the user is in the middle of changing keeps the value they chose.
    const controls: Partial<ControlValues> = {};
    if (!scrubbingFan && inFlight.fan === 0) controls.fanSpeed = reported.fanSpeed;
    if (inFlight.pump === 0) controls.pumpEnabled = reported.pumpEnabled;
    if (inFlight.cooler === 0) controls.coolerEnabled = reported.coolerEnabled;

    const sample: TelemetrySample = {
      timestamp: now,
      temperature: status.temperature,
      humidity: status.humidity,
    };

    set({
      ...controls,
      temperature: status.temperature,
      humidity: status.humidity,
      waterLevel: clamp(status.waterLevel, 0, 100),
      lastUpdated: now,
      readingCount: state.readingCount + 1,
      history: [...state.history, sample].slice(-HISTORY_LIMIT),
    });

    logTelemetry(status, now);
  }

  /** Optimistically apply a control change, send it, and roll back if the device refuses. */
  async function runCommand(options: {
    control: Control;
    name: string;
    details: LogDetails;
    optimistic: Partial<ControlValues>;
    send: () => Promise<DeviceStatus>;
  }) {
    const { control, name, details, optimistic, send } = options;

    if (get().connection !== 'connected') {
      logger.warn(SOURCE, `${name} command not sent: device offline`, details);
      showToast('Cooler is offline', 'warning');
      set(confirmed);
      return;
    }

    const ticket = ++tickets[control];
    inFlight[control] += 1;
    set(optimistic);
    logger.command(SOURCE, `${name} command sent`, details);

    try {
      const status = await send();
      inFlight[control] -= 1;
      if (ticket !== tickets[control]) return; // a newer command for this control is on its way
      logger.success(SOURCE, `${name} command accepted`, details);
      applyStatus(status);
    } catch (error) {
      inFlight[control] -= 1;
      logger.error(SOURCE, `${name} command failed`, { ...details, ...errorDetails(error) });
      if (ticket !== tickets[control]) return;
      set(confirmed);
      showToast(`Couldn't update the ${name.toLowerCase()}. Try again.`, 'warning');
    }
  }

  return {
    connection: 'disconnected',
    deviceInfo: null,
    connectionError: null,
    ...CLEARED_READINGS,
    fanSpeed: 0,
    pumpEnabled: false,
    coolerEnabled: false,
    lastUpdated: null,
    connectedAt: null,
    readingCount: 0,
    history: [],

    initialize: () => {
      if (initialized) return;
      initialized = true;
      logger.info(SOURCE, 'Device service initialized', { service: deviceService.label });

      deviceService.subscribe((event) => {
        if (event.type === 'status') {
          if (get().connection === 'connected') applyStatus(event.status);
          return;
        }
        connectAttempt += 1;
        logger.error(SOURCE, 'Connection lost', { reason: event.reason });
        set({ connection: 'error', connectionError: event.reason, ...CLEARED_READINGS });
      });

      void get().connect();
    },

    connect: async () => {
      const { connection } = get();
      if (connection === 'connecting' || connection === 'connected') return;

      const attempt = ++connectAttempt;
      set({ connection: 'connecting', connectionError: null });
      logger.info(SOURCE, 'Attempting connection');

      try {
        const info = await deviceService.connect();
        if (attempt !== connectAttempt) return;

        lastLogged = null;
        set({
          connection: 'connected',
          deviceInfo: info,
          connectedAt: Date.now(),
          readingCount: 0,
          history: [],
        });
        logger.success(SOURCE, `Connected to ${info.name}`, { address: info.address, firmware: info.firmware });

        await get().refreshStatus();
      } catch (error) {
        if (attempt !== connectAttempt) return;
        logger.error(SOURCE, 'Connection failed', errorDetails(error));
        set({
          connection: 'error',
          connectionError: describeConnectionFailure(error),
          ...CLEARED_READINGS,
        });
      }
    },

    disconnect: async () => {
      connectAttempt += 1;
      try {
        await deviceService.disconnect();
      } catch (error) {
        logger.error(SOURCE, 'Disconnect failed', errorDetails(error));
      }
      set({ connection: 'disconnected', connectionError: null, connectedAt: null, ...CLEARED_READINGS });
      logger.info(SOURCE, 'Disconnected');
    },

    refreshStatus: async () => {
      if (get().connection !== 'connected') return;
      try {
        const status = await deviceService.getStatus();
        logger.info(SOURCE, 'Status received');
        applyStatus(status);
      } catch (error) {
        logger.error(SOURCE, 'Status request failed', errorDetails(error));
      }
    },

    previewFanSpeed: (percent) => {
      scrubbingFan = true;
      set({ fanSpeed: clamp(Math.round(percent), 0, 100) });
    },

    setFanSpeed: async (percent) => {
      const fanSpeed = clamp(Math.round(percent), 0, 100);
      scrubbingFan = false;
      await runCommand({
        control: 'fan',
        name: 'Fan',
        details: { fanSpeed },
        optimistic: { fanSpeed },
        send: () => deviceService.setFanSpeed(fanSpeed),
      });
    },

    setPump: (pumpEnabled) =>
      runCommand({
        control: 'pump',
        name: 'Pump',
        details: { pump: pumpEnabled ? 'on' : 'off' },
        optimistic: { pumpEnabled },
        send: () => deviceService.setPump(pumpEnabled),
      }),

    setCooler: (coolerEnabled) =>
      runCommand({
        control: 'cooler',
        name: 'Cooler',
        details: { cooler: coolerEnabled ? 'on' : 'off' },
        optimistic: { coolerEnabled },
        send: () => deviceService.setCooler(coolerEnabled),
      }),
  };
});

export const selectIsConnected = (state: DeviceState) => state.connection === 'connected';
