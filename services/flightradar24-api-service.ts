import { getNested, getNestedOrDefault, sleep } from "../lib/utils.ts";
import { Bounds } from "../types/bounds.ts";
import { Flight } from "../types/flight.ts";
import Log from "../lib/log.ts";
import { config } from "../config.ts";

export class FlightRadar24ApiService {
  private logger: Log;

  constructor() {
    this.logger = new Log("fr24-api");
  }

  /**
   * Fetches flights within given bounds and retrieves details for each flight.
   */
  async getFlightsByBounds(
    bounds: Bounds,
    signal?: AbortSignal
  ): Promise<Flight[]> {
    // Fetch list of flights in bounds
    const flightIds = await this.fetchFlightIds(bounds, signal);
    if (flightIds.length === 0) {
      return [];
    }

    // Fetch details for each flight
    const flights: Flight[] = [];
    for (const flightId of flightIds) {
      if (signal?.aborted) {
        this.logger.debug("Flight detail retrieval cancelled");
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

  /**
   * Fetches detailed information for a specific flight.
   */
  async getFlightDetails(
    flightId: string,
    signal?: AbortSignal
  ): Promise<Flight | null> {
    try {
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
        this.logger.error(
          `Failed to deserialize flight details for flight ${flightId}`
        );
        return null;
      }

      return this.parseFlight(flightId, flightData);
    } catch (error) {
      this.logger.error(
        `Error fetching flight details for ${flightId}: ${error}`
      );
      return null;
    }
  }

  /**
   * Fetches airport information.
   */
  async getAirportInfo(
    icao: string,
    signal?: AbortSignal
  ): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(
        `${config.flightradar24.airportUrl}?code=${icao}`,
        { signal }
      );

      if (
        !this.validateJsonResponse(response, config.flightradar24.airportUrl)
      ) {
        return null;
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error fetching airport info for ${icao}: ${error}`);
      return null;
    }
  }

  /**
   * Private helper: Fetches the list of flight IDs in given bounds.
   */
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

      this.logger.debug(`Fetching flights from bounds '${bounds.label}'`);

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

      this.logger.debug(
        `Found ${flightIds.length} flights in the response from bounds '${bounds.label}'`
      );

      return flightIds;
    } catch (error) {
      this.logger.error(
        `Error fetching flight list for bounds '${bounds.label}': ${error}`
      );
      return [];
    }
  }

  /**
   * Private helper: Validates that response has JSON content-type.
   */
  private validateJsonResponse(response: Response, url: string): boolean {
    if (!response.headers.get("content-type")?.includes("application/json")) {
      this.logger.error(
        `Unexpected content type: ${response.headers.get(
          "content-type"
        )} with status ${response.status} (${response.statusText}) from ${url}`
      );
      return false;
    }
    return true;
  }

  /**
   * Private helper: Parses flight details from API response.
   */
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

  /**
   * Private helper: Converts bounds to query string format.
   */
  private boundsToString(bounds: Bounds): string {
    return `${bounds.latitudeMax.toFixed(4)},${bounds.latitudeMin.toFixed(
      4
    )},${bounds.longitudeMin.toFixed(4)},${bounds.longitudeMax.toFixed(4)}`;
  }
}
