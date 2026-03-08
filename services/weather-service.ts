import { DatabaseSync, SQLOutputValue } from "node:sqlite";
import { Weather } from "../types/weather.ts";
import { CreateResult } from "../types/create-result.ts";
import { NotFoundError } from "../lib/errors.ts";

export class WeatherService {
  constructor(private readonly db: DatabaseSync) {}

  getWeather(airportIcao: string): Weather | null {
    const row = this.db
      .prepare("SELECT * FROM airport WHERE icao = ?")
      .get(airportIcao.toUpperCase());
    if (!row) {
      throw new NotFoundError(`Airport ${airportIcao} not found`);
    }
    return this.mapToWeather(row);
  }

  setWeather(weather: Weather): CreateResult<Weather> {
    if (weather.airportIcao.length !== 4) {
      return [{ reason: "Airport ICAO must be 4 characters long" }, null];
    }
    let existingAirportId = this.db
      .prepare("SELECT id FROM airport WHERE icao = ?")
      .get(weather.airportIcao.toUpperCase())?.id;
    if (!existingAirportId) {
      this.db
        .prepare("INSERT INTO airport (icao, iata) VALUES (?, ?)")
        .run(
          weather.airportIcao.toUpperCase(),
          weather.airportIata?.toUpperCase()
        );
      existingAirportId = this.db
        .prepare("SELECT id FROM airport WHERE icao = ?")
        .get(weather.airportIcao.toUpperCase())?.id;
    }

    this.db
      .prepare(
        "INSERT INTO airport (metar, skyCondition, tempCelsius, timestamp) VALUES (?, ?, ?, ?)"
      )
      .run(
        weather.metar,
        weather.skyCondition,
        weather.tempCelsius,
        weather.timestamp
      );

    return [null, this.getWeather(weather.airportIcao)!];
  }

  private mapToWeather(row: Record<string, SQLOutputValue>): Weather {
    return {
      airportIcao: row.icao as string,
      airportIata: row.iata as string,
      metar: row.metar as string,
      skyCondition: row.skyCondition as string,
      tempCelsius: row.tempCelsius as number,
      timestamp: row.timestamp as number,
    };
  }
}
