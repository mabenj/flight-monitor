import { DatabaseSync } from "node:sqlite";
import { getNested, getNestedOrDefault, sleep } from "../lib/utils.ts";
import { Bounds } from "../types/bounds.ts";
import { Flight } from "../types/flight.ts";
import { BoundsService } from "../services/bounds-service.ts";
import { FlightsService } from "../services/flights-service.ts";
import Log from "../lib/log.ts";

const FLIGHT_DETAILS_URL =
  "https://data-live.flightradar24.com/clickhandler/?flight=";
const REALTIME_FLIGHTS_URL =
  "https://data-cloud.flightradar24.com/zones/fcgi/feed.js";
const HEADERS = {
  "accept-encoding": "gzip, br",
  "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  accept: "application/json",
  "cache-control": "max-age=0",
  origin: "https://www.flightradar24.com",
  referer: "https://www.flightradar24.com/",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "user-agent":
    "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
};
const REALTIME_FLIGHTS_PARAMS = {
  faa: 1,
  satellite: 1,
  mlat: 1,
  flarm: 1,
  adsb: 1,
  gnd: 1,
  air: 1,
  vehicles: 0,
  estimated: 1,
  maxage: 14400,
  gliders: 1,
  stats: 1,
  limit: 1500,
};

export async function scrapeActiveFlights(db: DatabaseSync) {
  const logger = new Log("scrape-active-flights");
  const boundsService = new BoundsService(db);
  const flightsService = new FlightsService(db);
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
  const url = new URL(REALTIME_FLIGHTS_URL);
  url.searchParams.append("bounds", boundsToString(bounds));
  Object.entries(REALTIME_FLIGHTS_PARAMS).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString());
  });
  logger.debug(`Fetching flights from bounds '${bounds.label}'`);
  const response = await fetch(url.toString(), { headers: HEADERS });
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
    const detailsResponse = await fetch(`${FLIGHT_DETAILS_URL}${key}`, {
      headers: {
        ...HEADERS,
      },
    });
    if (
      !detailsResponse.headers.get("content-type")?.includes("application/json")
    ) {
      logger.error(
        `Unexpected content type: ${detailsResponse.headers.get(
          "content-type"
        )} with status ${detailsResponse.status} (${
          detailsResponse.statusText
        }) from ${FLIGHT_DETAILS_URL}${key}`
      );
      continue;
    }
    const flight = await detailsResponse.json();
    if (!flight) {
      logger.error(`Failed to deserialize flight details for flight ${key}`);
      continue;
    }
    flights.push(parseFlight(key, flight));
    await sleep(200);
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
