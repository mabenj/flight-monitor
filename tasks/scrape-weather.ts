import { DatabaseSync } from "node:sqlite";
import Log from "../lib/log.ts";
import { BoundsService } from "../services/bounds-service.ts";
import { WeatherService } from "../services/weather-service.ts";
import { Weather } from "../types/weather.ts";
import { config } from "../config.ts";

export async function scrapeWeather(db: DatabaseSync) {
  const logger = new Log("scrape-weather");
  const boundsService = new BoundsService(db);
  const weatherService = new WeatherService(db);
  const bounds = boundsService.getActive();
  if (!bounds?.airportCode) {
    logger.warn("No active bounds with airport code found");
    return;
  }
  logger.debug(`Scraping weather for airport ${bounds.airportCode}`);
  const weather = await getWeather(bounds.airportCode);
  if (!weather) {
    logger.warn(`No weather found for airport ${bounds.airportCode}`);
    return;
  }
  weatherService.setWeather(weather);
}

async function getWeather(icao: string): Promise<Weather | null> {
  const response = await fetch(
    `${config.flightradar24.airportUrl}?code=${icao}`
  );
  const json = await response.json();
  const error = json["errors"]?.["message"];
  if (error) {
    throw new Error(error);
  }
  const data = json["result"]?.["response"]?.["airport"]?.["pluginData"];
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
