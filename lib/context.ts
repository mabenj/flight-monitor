/**
 * Application context - dependency container
 */

import { DatabaseSync } from "node:sqlite";
import { BoundsService } from "../services/bounds-service.ts";
import { FlightsService } from "../services/flights-service.ts";
import { SettingsService } from "../services/settings-service.ts";
import Log from "./log.ts";

export class AppContext {
  private constructor(
    public readonly db: DatabaseSync,
    public readonly boundsService: BoundsService,
    public readonly flightsService: FlightsService,
    public readonly settingsService: SettingsService,
    public readonly logger: Log
  ) {}

  static create(db: DatabaseSync): AppContext {
    const logger = new Log("app");

    return new AppContext(
      db,
      new BoundsService(db),
      new FlightsService(db),
      new SettingsService(db),
      logger
    );
  }
}
