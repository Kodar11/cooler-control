import { MockDeviceService } from './MockDeviceService';
import type { DeviceService, DeviceSimulation } from './types';

/**
 * ── The ESP32 integration point ─────────────────────────────────────────────
 *
 * This is the only place the app decides which device implementation it talks to.
 * To go live, write a class that implements `DeviceService` over the ESP32's local
 * HTTP/WebSocket API and construct it here instead:
 *
 *   export const deviceService: DeviceService = new Esp32DeviceService({ host: '192.168.4.1' });
 *   export const deviceSimulation: DeviceSimulation | null = null;
 *
 * The store, screens and components need no changes.
 */
const mock = new MockDeviceService();

export const deviceService: DeviceService = mock;

/** Fault injection for developer mode. `null` when talking to real hardware. */
export const deviceSimulation: DeviceSimulation | null = mock;

export * from './types';
