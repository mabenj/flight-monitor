import { DatabaseSync } from "node:sqlite";
import { getNested, getNestedOrDefault, sleep } from "../lib/utils.ts";
import { Bounds } from "../types/bounds.ts";
import { Flight } from "../types/flight.ts";
import { BoundsService } from "../services/bounds-service.ts";
import { FlightsService } from "../services/flights-service.ts";
import Log from "../lib/log.ts";
import { config } from "../config.ts";

export async function scrapeActiveFlights(db: DatabaseSync) {
  const logger = new Log("scrape-flights");
  const boundsService = new BoundsService(db);
  const flightsService = new FlightsService(db);
  flightsService.setActiveFlights([]);
  const bounds = boundsService.getActive();
  if (!bounds) {
    logger.info("No active bounds found");
    return;
  }
  const flights = await getFlights(bounds, logger);
  const activeBoundsId = boundsService.getActive()?.id;
  if (activeBoundsId !== bounds.id) {
    logger.info(
      "Active bounds changed during flight retrieval, skipping update"
    );
    return;
  }
  flightsService.setActiveFlights(flights);
}

async function getFlights(bounds: Bounds, logger: Log): Promise<Flight[]> {
  const url = new URL(config.flightradar24.realtimeUrl);
  url.searchParams.append("bounds", boundsToString(bounds));
  Object.entries(config.flightradar24.queryParams).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString());
  });
  logger.debug(`Fetching flights from bounds '${bounds.label}'`);
  const response = await fetch(url.toString(), {
    headers: config.flightradar24.headers,
  });
  if (!response.headers.get("content-type")?.includes("application/json")) {
    logger.error(
      `Unexpected content type: ${response.headers.get(
        "content-type"
      )} with status ${response.status} (${
        response.statusText
      }) from ${url.toString()}`
    );
    return [];
  }
  const data: Record<string, unknown> = await response.json();
  const keys = Object.keys(data).filter(
    (key) => key !== "full_count" && key !== "version" && key !== "stats"
  );
  logger.debug(`Found ${keys.length} flights in the response`);
  const flights: Flight[] = [];
  for (const key of keys) {
    const detailsResponse = await fetch(
      `${config.flightradar24.detailsUrl}${key}`,
      {
        headers: config.flightradar24.headers,
      }
    );
    if (
      !detailsResponse.headers.get("content-type")?.includes("application/json")
    ) {
      logger.error(
        `Unexpected content type: ${detailsResponse.headers.get(
          "content-type"
        )} with status ${detailsResponse.status} (${
          detailsResponse.statusText
        }) from ${config.flightradar24.detailsUrl}${key}`
      );
      continue;
    }
    const flight = await detailsResponse.json();
    if (!flight) {
      logger.error(`Failed to deserialize flight details for flight ${key}`);
      continue;
    }
    flights.push(parseFlight(key, flight));
    await sleep(config.flightradar24.delayBetweenRequestsMs);
  }

  return flights;
}

function parseFlight(id: string, flight: Record<string, unknown>): Flight {
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

function boundsToString(bounds: Bounds) {
  return `${bounds.latitudeMax.toFixed(4)},${bounds.latitudeMin.toFixed(
    4
  )},${bounds.longitudeMin.toFixed(4)},${bounds.longitudeMax.toFixed(4)}`;
}
