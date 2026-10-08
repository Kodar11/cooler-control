/**
 * Where the tank reading comes from.
 *
 * The cooler has no level sensor yet, so the reading is modelled here. When the hardware
 * gains one, the device service fills `DeviceStatus.waterLevel` from the ESP32 response
 * instead and this file can be deleted — nothing above the service changes.
 */
export interface WaterLevelSource {
  /** % of tank capacity, 0–100. */
  read(): number;
}

export class ModelledWaterTank implements WaterLevelSource {
  private level: number;

  constructor(initialLevel = 72) {
    this.level = initialLevel;
  }

  read(): number {
    return Math.round(this.level * 10) / 10;
  }

  /** Draw the tank down by `amount` percentage points. */
  consume(amount: number) {
    this.level = Math.max(0, this.level - amount);
  }
}
