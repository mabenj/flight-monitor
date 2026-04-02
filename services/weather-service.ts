import { DatabaseSync, SQLOutputValue } from "node:sqlite";
import { CreateResult } from "../types/create-result.ts";
import { Weather } from "../types/weather.ts";

export class WeatherService {
  constructor(private readonly db: DatabaseSync) {}

  getWeather(airportIcao: string): Weather | null {
    const row = this.db
      .prepare("SELECT * FROM airport WHERE icao = ?")
      .get(airportIcao.toUpperCase());
    if (!row) {
      return null;
    }
    const weather = this.mapToWeather(row);
    if (!weather.timestamp) {
      return null;
    }
    return weather;
  }

  setWeather(weather: Weather): CreateResult<Weather> {
    if (weather.airportIcao.length !== 4) {
      return [{ reason: "Airport ICAO must be 4 characters long" }, null];
    }
    try {
      this.db.exec("BEGIN TRANSACTION;");
      let airportId = this.db
        .prepare("SELECT id FROM airport WHERE icao = ?")
        .get(weather.airportIcao.toUpperCase())?.id;
      if (!airportId) {
        this.db
          .prepare("INSERT INTO airport (icao, iata) VALUES (?, ?)")
          .run(
            weather.airportIcao.toUpperCase(),
            weather.airportIata?.toUpperCase()
          );
        airportId = this.db
          .prepare("SELECT id FROM airport WHERE icao = ?")
          .get(weather.airportIcao.toUpperCase())?.id;
      }

      this.db
        .prepare(
          "UPDATE airport SET metar = ?, skyCondition = ?, tempCelsius = ?, timestamp = ? WHERE id = ?"
        )
        .run(
          weather.metar,
          weather.skyCondition,
          weather.tempCelsius,
          weather.timestamp,
          airportId!
        );

      this.db.exec("COMMIT;");
      return [null, this.getWeather(weather.airportIcao)!];
    } catch (error) {
      this.db.exec("ROLLBACK;");
      throw error;
    }
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
