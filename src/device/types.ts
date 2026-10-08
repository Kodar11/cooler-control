/**
 * The contract between the app and the cooler hardware.
 *
 * Everything above this file (store, screens, components) depends only on these types.
 * Everything that knows how to talk to a device lives behind `DeviceService`.
 */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/** A full snapshot of the cooler, as the device reports it. */
export interface DeviceStatus {
  /** °C, from the DHT22. */
  temperature: number;
  /** % relative humidity, from the DHT22. */
  humidity: number;
  /** % of tank capacity. */
  waterLevel: number;
  /** 0–100 %. */
  fanSpeed: number;
  pumpEnabled: boolean;
  coolerEnabled: boolean;
}

export interface DeviceInfo {
  /** Network name of the unit, e.g. "Cooler-AB12". */
  name: string;
  address: string;
  firmware: string | null;
}

export type DeviceErrorCode =
  | 'TIMEOUT'
  | 'UNREACHABLE'
  | 'NOT_CONNECTED'
  | 'REJECTED'
  | 'MALFORMED_RESPONSE';

export class DeviceError extends Error {
  readonly code: DeviceErrorCode;

  constructor(code: DeviceErrorCode, message: string) {
    super(message);
    this.name = 'DeviceError';
    this.code = code;
  }
}

export type DeviceEvent =
  /** The device pushed (or a poll returned) a fresh status snapshot. */
  | { type: 'status'; status: DeviceStatus }
  /** The link dropped without the app asking for it. */
  | { type: 'connection-lost'; reason: string };

export type DeviceListener = (event: DeviceEvent) => void;

export interface DeviceService {
  /** Human-readable name of the implementation, shown in diagnostics. */
  readonly label: string;

  /** Resolves once the device is reachable. Rejects with a `DeviceError`. */
  connect(): Promise<DeviceInfo>;
  disconnect(): Promise<void>;

  getStatus(): Promise<DeviceStatus>;

  /** Commands resolve with the status the device reports after applying them. */
  setFanSpeed(percent: number): Promise<DeviceStatus>;
  setPump(enabled: boolean): Promise<DeviceStatus>;
  setCooler(enabled: boolean): Promise<DeviceStatus>;

  /** Live updates while connected. Returns an unsubscribe function. */
  subscribe(listener: DeviceListener): () => void;
}

/** Fault injection offered by simulated devices, used to exercise offline and error states. */
export interface DeviceSimulation {
  dropConnection(): void;
  failNextConnection(): void;
  failNextCommand(): void;
}
