import { Weather } from "../types/weather.ts";
import { AppContext } from "../lib/context.ts";
import type { FlightRadar24ApiService } from "../services/flightradar24-api-service.ts";
import { logger } from "../lib/log.ts";

const log = logger("scrape-weather");

export async function scrapeWeather(ctx: AppContext, signal?: AbortSignal) {
  const { boundsService, weatherService, fr24 } = ctx;

  const bounds = boundsService.getActive();
  if (!bounds?.airportCode) {
    log.warn("No active bounds with airport code found");
    return;
  }
  log.debug(`Scraping weather for airport {airportCode}`, {
    airportCode: bounds.airportCode,
  });
  const weather = await getWeather(bounds.airportCode, fr24, signal);
  if (!weather) {
    log.warn(`No weather found for airport {airportCode}`, {
      airportCode: bounds.airportCode,
    });
    return;
  }
  weatherService.setWeather(weather);
}

async function getWeather(
  icao: string,
  fr24: FlightRadar24ApiService,
  signal?: AbortSignal
): Promise<Weather | null> {
  const json = await fr24.getAirportInfo(icao, signal);
  if (!json) {
    return null;
  }

  // deno-lint-ignore no-explicit-any
  const jsonData = json as any;
  const error = jsonData["errors"]?.["message"];
  if (error) {
    throw new Error(error as string);
  }

  const data = jsonData["result"]?.["response"]?.["airport"]?.["pluginData"];
  if (!data?.["details"]) {
    return null;
  }

  return {
    airportIcao: data["details"]?.["code"]?.["icao"],
    airportIata: data["details"]?.["code"]?.["iata"],
    metar: data["weather"]?.["metar"],
    skyCondition: data["weather"]?.["sky"]?.["condition"]?.["text"],
    tempCelsius: data["weather"]?.["temp"]?.["celsius"],
    timestamp: data["weather"]?.["time"],
  };
}
