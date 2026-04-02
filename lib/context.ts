/**
 * Application context - dependency container
 */

import { DatabaseSync } from "node:sqlite";
import { BoundsService } from "../services/bounds-service.ts";
import { FlightsService } from "../services/flights-service.ts";
import { SettingsService } from "../services/settings-service.ts";
import Log from "./log.ts";
import { WeatherService } from "../services/weather-service.ts";
import { MatrixClient } from "../rgb-matrix/matrix-client.ts";
import { ElectricityPriceService } from "../services/electricity-price-service.ts";

export class AppContext {
  private constructor(
    public readonly db: DatabaseSync,
    public readonly boundsService: BoundsService,
    public readonly flightsService: FlightsService,
    public readonly settingsService: SettingsService,
    public readonly weatherService: WeatherService,
    public readonly logger: Log,
    public readonly events: EventTarget,
    public readonly priceService: ElectricityPriceService,
    public readonly matrix: MatrixClient
  ) {}

  static create(db: DatabaseSync): AppContext {
    const events = new EventTarget();

    return new AppContext(
      db,
      new BoundsService(db, events),
      new FlightsService(db),
      new SettingsService(db),
      new WeatherService(db),
      new Log("app"),
      events,
      new ElectricityPriceService(),
      MatrixClient.getInstance()
    );
  }
}
