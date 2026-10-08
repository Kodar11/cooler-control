import type { ConnectionState, DeviceInfo } from '@/device';
import type { ColorToken } from '@/theme';

/**
 * Words for device state. Status is always spoken in text as well as colour,
 * and every screen uses the same wording.
 */

export interface ConnectionCopy {
  label: string;
  detail: string;
  color: ColorToken;
}

export function describeConnection(state: ConnectionState, info: DeviceInfo | null): ConnectionCopy {
  switch (state) {
    case 'connected':
      return { label: 'Connected', detail: info?.name ?? 'Cooler', color: 'good' };
    case 'connecting':
      return { label: 'Connecting', detail: 'Looking for your cooler', color: 'warn' };
    case 'error':
      return { label: 'Connection problem', detail: 'Cooler unreachable', color: 'danger' };
    case 'disconnected':
      return { label: 'Disconnected', detail: 'Connect to cooler Wi-Fi', color: 'inkMuted' };
  }
}

export function describeFanSpeed(percent: number): string {
  if (percent <= 0) return 'Off';
  if (percent <= 33) return 'Low';
  if (percent <= 66) return 'Medium';
  if (percent < 100) return 'High';
  return 'Max';
}

export function describeHumidity(percent: number): string {
  if (percent < 35) return 'Dry';
  if (percent <= 60) return 'Comfortable';
  return 'Humid';
}

export interface WaterCopy {
  label: string;
  low: boolean;
}

export function describeWaterLevel(percent: number): WaterCopy {
  if (percent >= 60) return { label: 'Good', low: false };
  if (percent >= 30) return { label: 'Fair', low: false };
  if (percent >= 10) return { label: 'Low', low: true };
  return { label: 'Refill needed', low: true };
}
