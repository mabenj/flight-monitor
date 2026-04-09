import { DatabaseSync } from "node:sqlite";
import { BrightnessChangedEvent } from "../lib/events.ts";

export class SettingsService {
  constructor(
    private readonly db: DatabaseSync,
    private readonly events: EventTarget
  ) {}

  get(key: string): string | null {
    const row = this.db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get(key);
    return row ? (row.value as string) : null;
  }

  set(key: string, value: string): void {
    this.db
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run(key, value);
  }

  getBrightness(): number {
    const value = this.get("brightness");
    return value ? parseInt(value, 10) : 50;
  }

  setBrightness(brightness: number) {
    this.set("brightness", brightness.toString());
    this.events.dispatchEvent(new BrightnessChangedEvent(brightness));
  }
}
