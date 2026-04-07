import Log from "../lib/log.ts";
import { BoundsService } from "../services/bounds-service.ts";
import { WeatherService } from "../services/weather-service.ts";
import { FlightRadar24ApiService } from "../services/flightradar24-api-service.ts";
import { Weather } from "../types/weather.ts";
import { AppContext } from "../lib/context.ts";

export async function scrapeWeather(ctx: AppContext, signal?: AbortSignal) {
  const logger = new Log("scrape-weather");
  const boundsService = new BoundsService(ctx.db, ctx.events);
  const weatherService = new WeatherService(ctx.db);
  const apiService = new FlightRadar24ApiService();

  const bounds = boundsService.getActive();
  if (!bounds?.airportCode) {
    logger.warn("No active bounds with airport code found");
    return;
  }
  logger.debug(`Scraping weather for airport ${bounds.airportCode}`);
  const weather = await getWeather(bounds.airportCode, apiService, signal);
  if (!weather) {
    logger.warn(`No weather found for airport ${bounds.airportCode}`);
    return;
  }
  weatherService.setWeather(weather);
}

async function getWeather(
  icao: string,
  apiService: FlightRadar24ApiService,
  signal?: AbortSignal
): Promise<Weather | null> {
  const json = await apiService.getAirportInfo(icao, signal);
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
