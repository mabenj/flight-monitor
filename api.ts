import { get } from "node:http";
import { Flight } from "./types.ts";
import { getNested, getNestedOrDefault } from "./utils.ts";

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

/**
 *
 * @param boundsString Bounds in the format \<maxLat\>,\<minLat\>,\<maxLon\>,\<minLon\>
 * @returns An array of Flight objects
 */
export async function getFlights(boundsString: string): Promise<Flight[]> {
  const url = new URL(REALTIME_FLIGHTS_URL);
  url.searchParams.append("bounds", boundsString);
  Object.entries(REALTIME_FLIGHTS_PARAMS).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString());
  });
  const response = await fetch(url.toString(), { headers: HEADERS });
  const data: Record<string, unknown> = await response.json();
  const flights: Flight[] = [];
  for (const [key, _] of Object.entries(data)) {
    if (key === "full_count" || key === "version" || key === "stats") {
      continue;
    }
    const flight = await fetch(`${FLIGHT_DETAILS_URL}${key}`, {
      headers: HEADERS,
    }).then((res) => res.json());
    flights.push(parseFlight(key, flight));
  }

  return flights;
}

function parseFlight(id: string, flight: Record<string, unknown>): Flight {
  const trail =
    (getNested(flight, "trail") as Array<Record<string, unknown>>) || [];
  return {
    id: getNestedOrDefault(flight, "identification.id", id),
    flightNumber: getNested(flight, "identification.number.default"),
    callsign: getNested(flight, "identification.callsign"),
    aircraft: {
      modelCode: getNested(flight, "aircraft.model.code"),
      modelText: getNested(flight, "aircraft.model.text"),
      registration: getNested(flight, "aircraft.registration"),
    },
    airline: {
      icao: getNested(flight, "airline.code.icao"),
      iata: getNested(flight, "airline.code.iata"),
      name:
        getNested(flight, "airline.short") ?? getNested(flight, "airline.name"),
    },
    metrics: {
      altitude: getNested(trail[0], "alt"),
      groundSpeed: getNested(trail[0], "spd"),
      heading: getNested(trail[0], "hd"),
    },
    route: {
      origin: {
        iata: getNested(flight, "airport.origin.code.iata"),
        icao: getNested(flight, "airport.origin.code.icao"),
        name: getNested(flight, "airport.origin.name"),
      },
      destination: {
        iata: getNested(flight, "airport.destination.code.iata"),
        icao: getNested(flight, "airport.destination.code.icao"),
        name: getNested(flight, "airport.destination.name"),
      },
    },
    schedule: {
      departure: {
        scheduled: getNested(flight, "time.scheduled.departure"),
        estimated: getNested(flight, "time.estimated.departure"),
        actual: getNested(flight, "time.real.departure"),
      },
      arrival: {
        scheduled: getNested(flight, "time.scheduled.arrival"),
        estimated: getNested(flight, "time.estimated.arrival"),
        actual: getNested(flight, "time.real.arrival"),
      },
    },
  };
}
