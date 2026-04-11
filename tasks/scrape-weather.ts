import { AppContext } from "../lib/context.ts";
import { logger } from "../lib/log.ts";

const log = logger("scrape-weather");

export async function scrapeWeather(ctx: AppContext, signal?: AbortSignal) {
  const { boundsService, weatherService, fr24 } = ctx;

  const bounds = boundsService.getActive();
  if (!bounds?.airportCode) {
    return;
  }

  const weather = await fr24.getAirportWeather(bounds.airportCode, signal);
  if (!weather) {
    log.warn(`No weather found for airport {airportCode}`, {
      airportCode: bounds.airportCode,
    });
    return;
  }
  weatherService.setWeather(weather);
}
