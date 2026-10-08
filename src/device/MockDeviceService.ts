import { clamp } from '@/lib/format';
import { logger } from '@/logging/logger';

import {
  DeviceError,
  type DeviceEvent,
  type DeviceInfo,
  type DeviceListener,
  type DeviceService,
  type DeviceSimulation,
  type DeviceStatus,
} from './types';
import { ModelledWaterTank } from './waterLevel';

const SOURCE = 'device';

const INFO: DeviceInfo = { name: 'Cooler-AB12', address: '192.168.4.1', firmware: '0.9.2' };

const TELEMETRY_INTERVAL_MS = 2000;
const CONNECT_DELAY_MS = 1400;
const CONNECT_TIMEOUT_MS = 2600;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const jitter = (amplitude: number) => (Math.random() * 2 - 1) * amplitude;
const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * A simulated cooler that behaves like the real unit is expected to: connecting takes a moment,
 * commands have latency, and the cabin slowly responds to the fan and pump.
 *
 * All simulation lives in this class. Swap it for a real implementation in `device/index.ts`.
 */
export class MockDeviceService implements DeviceService, DeviceSimulation {
  readonly label = 'Simulated device';

  private listeners = new Set<DeviceListener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private connected = false;
  private requestCount = 0;
  private faults = { connection: false, command: false };

  private tank = new ModelledWaterTank();
  private ambient = 34.2;
  private temperature = 32.6;
  private humidity = 51.4;
  private fanSpeed = 65;
  private pumpEnabled = true;
  private coolerEnabled = true;

  // ── DeviceService ────────────────────────────────────────────────────────

  async connect(): Promise<DeviceInfo> {
    logger.info(SOURCE, 'Device connection started', { address: INFO.address });

    if (this.faults.connection) {
      this.faults.connection = false;
      await wait(CONNECT_TIMEOUT_MS);
      logger.error(SOURCE, 'Connection timed out', { address: INFO.address, timeoutMs: CONNECT_TIMEOUT_MS });
      throw new DeviceError('TIMEOUT', 'The cooler did not respond.');
    }

    await wait(CONNECT_DELAY_MS);
    this.connected = true;
    logger.info(SOURCE, 'Cooler network detected', { name: INFO.name });
    this.startTelemetry();
    return INFO;
  }

  async disconnect(): Promise<void> {
    this.stopTelemetry();
    this.connected = false;
    logger.info(SOURCE, 'Device connection closed');
  }

  getStatus(): Promise<DeviceStatus> {
    return this.request('getStatus', undefined, () => undefined);
  }

  setFanSpeed(percent: number): Promise<DeviceStatus> {
    return this.request('setFanSpeed', `fanSpeed=${percent}`, () => {
      this.fanSpeed = clamp(Math.round(percent), 0, 100);
    });
  }

  setPump(enabled: boolean): Promise<DeviceStatus> {
    return this.request('setPump', `pump=${enabled ? 'on' : 'off'}`, () => {
      this.pumpEnabled = enabled;
    });
  }

  setCooler(enabled: boolean): Promise<DeviceStatus> {
    return this.request('setCooler', `cooler=${enabled ? 'on' : 'off'}`, () => {
      this.coolerEnabled = enabled;
    });
  }

  subscribe(listener: DeviceListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── DeviceSimulation ─────────────────────────────────────────────────────

  dropConnection() {
    if (!this.connected) return;
    this.stopTelemetry();
    this.connected = false;
    logger.warn(SOURCE, 'Link lost', { reason: 'no response from device' });
    this.emit({ type: 'connection-lost', reason: 'Connection to the cooler was lost.' });
  }

  failNextConnection() {
    this.faults.connection = true;
  }

  failNextCommand() {
    this.faults.command = true;
  }

  // ── Internals ────────────────────────────────────────────────────────────

  /** Mimics one round trip to the device, with the logging a real transport would produce. */
  private async request(name: string, payload: string | undefined, apply: () => void): Promise<DeviceStatus> {
    const id = ++this.requestCount;
    const startedAt = Date.now();
    logger.debug(SOURCE, 'Request started', { id, request: name, payload });

    if (!this.connected) {
      logger.error(SOURCE, 'Request failed', { id, request: name, error: 'NOT_CONNECTED' });
      throw new DeviceError('NOT_CONNECTED', 'The cooler is not connected.');
    }

    await wait(90 + Math.random() * 120);

    if (!this.connected) {
      logger.error(SOURCE, 'Request failed', { id, request: name, error: 'UNREACHABLE' });
      throw new DeviceError('UNREACHABLE', 'The cooler stopped responding.');
    }

    if (this.faults.command && name !== 'getStatus') {
      this.faults.command = false;
      logger.error(SOURCE, 'Request failed', {
        id,
        request: name,
        error: 'TIMEOUT',
        durationMs: Date.now() - startedAt,
      });
      throw new DeviceError('TIMEOUT', 'The cooler did not confirm the command.');
    }

    apply();
    const status = this.snapshot();
    logger.debug(SOURCE, 'Request completed', { id, request: name, durationMs: Date.now() - startedAt });
    return status;
  }

  private snapshot(): DeviceStatus {
    return {
      temperature: round1(this.temperature),
      humidity: round1(this.humidity),
      waterLevel: this.tank.read(),
      fanSpeed: this.fanSpeed,
      pumpEnabled: this.pumpEnabled,
      coolerEnabled: this.coolerEnabled,
    };
  }

  private emit(event: DeviceEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  private startTelemetry() {
    this.stopTelemetry();
    this.timer = setInterval(() => {
      this.step();
      this.emit({ type: 'status', status: this.snapshot() });
    }, TELEMETRY_INTERVAL_MS);
  }

  private stopTelemetry() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /**
   * Advance the cabin model by one tick. Readings ease toward a target set by the controls,
   * with sensor-scale noise on top, so the numbers drift the way a DHT22 in a car does.
   */
  private step() {
    const airflow = this.coolerEnabled ? this.fanSpeed / 100 : 0;
    const evaporating = this.coolerEnabled && this.pumpEnabled && this.tank.read() > 0;
    const wet = evaporating ? 1 : 0;

    this.ambient = clamp(this.ambient + jitter(0.02), 33.4, 35);

    const targetTemperature = this.ambient - airflow * (1.4 + 5.2 * wet);
    this.temperature += (targetTemperature - this.temperature) * 0.07 + jitter(0.07);

    const targetHumidity = 44 + airflow * wet * 17;
    this.humidity = clamp(this.humidity + (targetHumidity - this.humidity) * 0.06 + jitter(0.3), 20, 95);

    if (evaporating) this.tank.consume(0.004 + 0.012 * airflow);
  }
}
