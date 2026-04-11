import { getNested, getNestedOrDefault, sleep } from "../lib/utils.ts";
import { Bounds } from "../types/bounds.ts";
import { Flight } from "../types/flight.ts";
import { config } from "../config.ts";
import { logger } from "../lib/log.ts";
import { Weather } from "../types/weather.ts";

export class FlightRadar24ApiService {
  private log = logger(FlightRadar24ApiService.name);

  async getFlightsByBounds(
    bounds: Bounds,
    signal?: AbortSignal
  ): Promise<Flight[]> {
    const flightIds = await this.fetchFlightIds(bounds, signal);
    if (flightIds.length === 0) {
      return [];
    }

    const flights: Flight[] = [];
    for (const flightId of flightIds) {
      if (signal?.aborted) {
        this.log.debug("Flight detail retrieval cancelled");
        break;
      }

      const flight = await this.getFlightDetails(flightId, signal);
      if (flight) {
        flights.push(flight);
      }
      await sleep(config.flightradar24.delayBetweenRequestsMs, signal);
    }

    return flights;
  }

  async getFlightDetails(
    flightId: string,
    signal?: AbortSignal
  ): Promise<Flight | null> {
    try {
      this.log.debug(`Fetching flight details for {flightId}`, { flightId });
      const response = await fetch(
        `${config.flightradar24.detailsUrl}${flightId}`,
        {
          headers: config.flightradar24.headers,
          signal,
        }
      );

      if (
        !this.validateJsonResponse(
          response,
          config.flightradar24.detailsUrl + flightId
        )
      ) {
        return null;
      }

      const flightData = await response.json();
      if (!flightData) {
        this.log.error(
          `Failed to deserialize flight details for flight {flightId}: {responseStatus} {responseText}`,
          {
            flightId,
            responseStatus: response.status,
            responseText: await response.text(),
          }
        );
        return null;
      }

      return this.parseFlight(flightId, flightData);
    } catch (error) {
      this.log.error(
        `Error fetching flight details for flight {flightId}: {error}`,
        {
          flightId,
          error,
        }
      );
      return null;
    }
  }

  async getAirportWeather(
    icao: string,
    signal?: AbortSignal
  ): Promise<Weather | null> {
    try {
      this.log.debug(`Fetching airport weather for {icao}`, { icao });
      const response = await fetch(
        `${config.flightradar24.airportUrl}?code=${icao}`,
        { signal }
      );

      if (
        !this.validateJsonResponse(response, config.flightradar24.airportUrl)
      ) {
        return null;
      }

      const json = await response.json();
      if (!json) {
        this.log.error(
          `Failed to deserialize airport info for {icao}: {responseStatus} {responseText}`,
          {
            icao,
            responseStatus: response.status,
            responseText: await response.text(),
          }
        );
        return null;
      }

      return this.parseAirportWeather(json);
    } catch (error) {
      this.log.error(`Error fetching airport info for {icao}: {error}`, {
        icao,
        error,
      });
      return null;
    }
  }

  private async fetchFlightIds(
    bounds: Bounds,
    signal?: AbortSignal
  ): Promise<string[]> {
    try {
      const url = new URL(config.flightradar24.realtimeUrl);
      url.searchParams.append("bounds", this.boundsToString(bounds));
      Object.entries(config.flightradar24.queryParams).forEach(
        ([key, value]) => {
          url.searchParams.append(key, value.toString());
        }
      );

      this.log.debug(`Fetching flights from bounds {label}`, {
        label: bounds.label,
        url: url.toString(),
      });
      const response = await fetch(url.toString(), {
        headers: config.flightradar24.headers,
        signal,
      });

      if (!this.validateJsonResponse(response, url.toString())) {
        return [];
      }

      const data: Record<string, unknown> = await response.json();
      const flightIds = Object.keys(data).filter(
        (key) => key !== "full_count" && key !== "version" && key !== "stats"
      );

      this.log.debug(`Found {count} flights`, {
        count: flightIds.length,
      });

      return flightIds;
    } catch (error) {
      this.log.error(`Error fetching flight list for bounds {label}: {error}`, {
        label: bounds.label,
        error,
      });
      return [];
    }
  }

  private validateJsonResponse(response: Response, url: string): boolean {
    if (!response.headers.get("content-type")?.includes("application/json")) {
      this.log.error(
        `Unexpected content type: {contentType} with status {status} ({statusText}) from {url}`,
        {
          url,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type"),
        }
      );
      return false;
    }
    return true;
  }

  private parseFlight(id: string, flight: Record<string, unknown>): Flight {
    const trail =
      (getNested(flight, "trail") as Array<Record<string, unknown>>) || [];
    return {
      id: getNestedOrDefault(flight, "identification.id", id),
      flightNumber: getNested(flight, "identification.number.default")!,
      callsign: getNested(flight, "identification.callsign")!,
      aircraft: {
        modelCode: getNested(flight, "aircraft.model.code")!,
        modelText: getNested(flight, "aircraft.model.text")!,
        registration: getNested(flight, "aircraft.registration")!,
      },
      airline: {
        icao: getNested(flight, "airline.code.icao")!,
        iata: getNested(flight, "airline.code.iata")!,
        name:
          getNested(flight, "airline.short") ??
          getNested(flight, "airline.name")!,
      },
      altitude: getNested(trail[0], "alt")!,
      groundSpeed: getNested(trail[0], "spd")!,
      heading: getNested(trail[0], "hd")!,
      origin: {
        iata: getNested(flight, "airport.origin.code.iata")!,
        icao: getNested(flight, "airport.origin.code.icao")!,
        name: getNested(flight, "airport.origin.name")!,
      },
      destination: {
        iata: getNested(flight, "airport.destination.code.iata")!,
        icao: getNested(flight, "airport.destination.code.icao")!,
        name: getNested(flight, "airport.destination.name")!,
      },
      departureTime: {
        scheduled: getNested(flight, "time.scheduled.departure")!,
        estimated: getNested(flight, "time.estimated.departure")!,
        actual: getNested(flight, "time.real.departure")!,
      },
      arrivalTime: {
        scheduled: getNested(flight, "time.scheduled.arrival")!,
        estimated: getNested(flight, "time.estimated.arrival")!,
        actual: getNested(flight, "time.real.arrival")!,
      },
      timestamp: -1,
    };
  }

  // deno-lint-ignore no-explicit-any
  private parseAirportWeather(jsonData: any): Weather | null {
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

  private boundsToString(bounds: Bounds): string {
    return `${bounds.latitudeMax.toFixed(4)},${bounds.latitudeMin.toFixed(
      4
    )},${bounds.longitudeMin.toFixed(4)},${bounds.longitudeMax.toFixed(4)}`;
  }
}
