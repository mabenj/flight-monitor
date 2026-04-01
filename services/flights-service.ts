import { DatabaseSync, SQLOutputValue } from "node:sqlite";
import { Flight } from "../types/flight.ts";
import { distinctBy } from "../lib/utils.ts";

export class FlightsService {
  constructor(private readonly db: DatabaseSync) {}

  getActiveFlights(): Flight[] {
    const sql = `
        SELECT 
            f.*, 
            a.modelCode as aircraftModelCode,
            a.modelText as aircraftModelText,
            a.registration as aircraftRegistration,
            al.icao as airlineIcao,
            al.iata as airlineIata,
            al.name as airlineName,
            o.icao as originIcao,
            o.iata as originIata,
            o.name as originName,
            d.icao as destinationIcao,
            d.iata as destinationIata,
            d.name as destinationName
        FROM activeFlight AS af
        JOIN flight AS f ON af.flightId = f.id
        LEFT JOIN aircraft AS a ON f.aircraftId = a.id
        LEFT JOIN airline as al ON f.airlineId = al.id
        LEFT JOIN airport as o ON f.originAirportId = o.id
        LEFT JOIN airport as d ON f.destinationAirportId = d.id
    `;
    const rows = this.db.prepare(sql).all();
    const flights: Flight[] = rows.map((row) => ({
      id: row.id as string,
      callsign: row.callsign as string,
      flightNumber: row.flightNumber as string,
      altitude: row.altitude as number,
      groundSpeed: row.groundSpeed as number,
      heading: row.heading as number,
      timestamp: row.timestamp as number,
      departureTime: {
        scheduled: row.scheduledDeparture as number,
        estimated: row.estimatedDeparture as number,
        actual: row.actualDeparture as number,
      },
      arrivalTime: {
        scheduled: row.scheduledArrival as number,
        estimated: row.estimatedArrival as number,
        actual: row.actualArrival as number,
      },
      aircraft: {
        modelCode: row.aircraftModelCode as string,
        modelText: row.aircraftModelText as string,
        registration: row.aircraftRegistration as string,
      },
      airline: {
        icao: row.airlineIcao as string,
        iata: row.airlineIata as string,
        name: row.airlineName as string,
      },
      origin: {
        icao: row.originIcao as string,
        iata: row.originIata as string,
        name: row.originName as string,
      },
      destination: {
        icao: row.destinationIcao as string,
        iata: row.destinationIata as string,
        name: row.destinationName as string,
      },
    }));
    return sortFlights(flights);
  }

  setActiveFlights(flights: Flight[]) {
    try {
      this.db.exec("BEGIN TRANSACTION;");
      this.upsertAirlines(flights);
      this.upsertAirports(flights);
      this.upsertAircrafts(flights);
      this.upsertFlights(flights);

      this.db.prepare("DELETE FROM activeFlight;").run();
      const statement = this.db.prepare(
        "INSERT INTO activeFlight (flightId) VALUES (?)"
      );
      for (const flight of flights) {
        statement.run(flight.id);
      }
      this.db.exec("COMMIT;");
    } catch (error) {
      this.db.exec("ROLLBACK;");
      throw error;
    }
  }

  private upsertAirlines(flights: Flight[]) {
    const airlines = flights
      .map((flight) => flight.airline)
      .filter((airline) => !!airline);
    for (const airline of distinctBy(airlines, "icao", "iata")) {
      if (!airline.icao && !airline.iata) {
        continue;
      }
      const existingAirline = this.db
        .prepare("SELECT * FROM airline WHERE icao = ? OR iata = ? LIMIT 1")
        .get(airline.icao ?? null, airline.iata ?? null);
      if (existingAirline) {
        this.db
          .prepare(
            "UPDATE airline SET name = ?, icao = ?, iata = ? WHERE id = ?"
          )
          .run(
            existingAirline.name || airline.name?.toString() || null,
            existingAirline.icao || airline.icao?.toString() || null,
            existingAirline.iata || airline.iata?.toString() || null,
            existingAirline.id
          );
      } else {
        this.db
          .prepare("INSERT INTO airline (name, icao, iata) VALUES (?, ?, ?)")
          .run(
            airline.name?.toString() ?? null,
            airline.icao?.toString() ?? null,
            airline.iata?.toString() ?? null
          );
      }
    }
  }

  private upsertAirports(flights: Flight[]) {
    const airports = flights
      .map((flight) => [flight.origin, flight.destination])
      .flat()
      .filter((airport) => !!airport);
    for (const airport of distinctBy(airports, "icao", "iata")) {
      if (!airport.icao && !airport.iata) {
        continue;
      }
      const existingAirport = this.db
        .prepare("SELECT * FROM airport WHERE icao = ? OR iata = ? LIMIT 1")
        .get(airport.icao ?? null, airport.iata ?? null);
      if (existingAirport) {
        this.db
          .prepare(
            "UPDATE airport SET name = ?, icao = ?, iata = ? WHERE id = ?"
          )
          .run(
            existingAirport.name || airport.name?.toString() || null,
            existingAirport.icao || airport.icao?.toString() || null,
            existingAirport.iata || airport.iata?.toString() || null,
            existingAirport.id
          );
      } else {
        this.db
          .prepare("INSERT INTO airport (name, icao, iata) VALUES (?, ?, ?)")
          .run(
            airport.name?.toString() ?? null,
            airport.icao?.toString() ?? null,
            airport.iata?.toString() ?? null
          );
      }
    }
  }

  private upsertAircrafts(flights: Flight[]) {
    const aircrafts = flights
      .map((flight) => flight.aircraft)
      .filter((aircraft) => !!aircraft);
    for (const aircraft of aircrafts) {
      if (!aircraft.registration && !aircraft.modelCode) {
        continue;
      }
      let existingAircraft: Record<string, SQLOutputValue> | undefined;
      if (aircraft.registration) {
        existingAircraft = this.db
          .prepare("SELECT * FROM aircraft WHERE registration = ? LIMIT 1")
          .get(aircraft.registration);
      } else if (aircraft.modelCode) {
        existingAircraft = this.db
          .prepare(
            "SELECT * FROM aircraft WHERE modelCode = ? AND registration IS NULL LIMIT 1"
          )
          .get(aircraft.modelCode);
      }
      if (existingAircraft) {
        this.db
          .prepare(
            "UPDATE aircraft SET modelCode = ?, modelText = ? WHERE id = ?"
          )
          .run(
            existingAircraft.modelCode ||
              aircraft.modelCode?.toString() ||
              null,
            existingAircraft.modelText ||
              aircraft.modelText?.toString() ||
              null,
            existingAircraft.id
          );
      } else {
        this.db
          .prepare(
            "INSERT INTO aircraft (modelCode, modelText, registration) VALUES (?, ?, ?)"
          )
          .run(
            aircraft.modelCode?.toString() ?? null,
            aircraft.modelText?.toString() ?? null,
            aircraft.registration.toString()
          );
      }
    }
  }

  private upsertFlights(flights: Flight[]) {
    const activeBoundsId = this.db
      .prepare("SELECT id FROM bounds WHERE isActive = 1 LIMIT 1")
      .get()?.id;
    const unixTimestamp = Math.floor(Date.now() / 1000);
    for (const flight of flights) {
      if (!flight.id) {
        continue;
      }
      const rowValues = {
        id: toStringOrNull(flight.id),
        callsign: toStringOrNull(flight.callsign),
        flightNumber: toStringOrNull(flight.flightNumber),
        altitude: numberOrNull(flight.altitude),
        groundSpeed: numberOrNull(flight.groundSpeed),
        heading: numberOrNull(flight.heading),
        scheduledDeparture: numberOrNull(flight.departureTime?.scheduled),
        estimatedDeparture: numberOrNull(flight.departureTime?.estimated),
        actualDeparture: numberOrNull(flight.departureTime?.actual),
        scheduledArrival: numberOrNull(flight.arrivalTime?.scheduled),
        estimatedArrival: numberOrNull(flight.arrivalTime?.estimated),
        actualArrival: numberOrNull(flight.arrivalTime?.actual),
        timestamp: unixTimestamp,
        boundsId: numberOrNull(activeBoundsId),
        aircraftId: toStringOrNull(flight.aircraft?.registration)
          ? this.db
              .prepare("SELECT id FROM aircraft WHERE registration = ? LIMIT 1")
              .get(flight.aircraft.registration ?? null)?.id ?? null
          : null,
        airlineId: flight.airline
          ? this.db
              .prepare(
                "SELECT id FROM airline WHERE icao = ? OR iata = ? LIMIT 1"
              )
              .get(flight.airline.icao ?? null, flight.airline.iata ?? null)
              ?.id ?? null
          : null,
        originAirportId: flight.origin
          ? this.db
              .prepare(
                "SELECT id FROM airport WHERE icao = ? OR iata = ? LIMIT 1"
              )
              .get(flight.origin.icao ?? null, flight.origin.iata ?? null)
              ?.id ?? null
          : null,
        destinationAirportId: flight.destination
          ? this.db
              .prepare(
                "SELECT id FROM airport WHERE icao = ? OR iata = ? LIMIT 1"
              )
              .get(
                flight.destination.icao ?? null,
                flight.destination.iata ?? null
              )?.id ?? null
          : null,
      };
      const existingFlightId = this.db
        .prepare("SELECT id FROM flight WHERE id = ? LIMIT 1")
        .get(rowValues.id)?.id;
      if (existingFlightId) {
        let sql = "";
        sql += "UPDATE flight SET ";
        sql += Object.keys(rowValues)
          .map((key) => `${key} = ?`)
          .join(", ");
        sql += ` WHERE id = ?`;

        this.db.prepare(sql).run(...Object.values(rowValues), existingFlightId);
      } else {
        let sql = "";
        sql += "INSERT INTO flight (";
        sql += Object.keys(rowValues).join(", ");
        sql += ") VALUES (";
        sql += Object.keys(rowValues)
          .map(() => "?")
          .join(", ");
        sql += ")";

        this.db.prepare(sql).run(...Object.values(rowValues));
      }
    }
  }
}

function numberOrNull(input: unknown): number | null {
  if (typeof input === "number") {
    return input;
  }
  return null;
}

function toStringOrNull(input: unknown): string | null {
  if (typeof input === "string") {
    return input;
  }
  return null;
}

function sortFlights(flights: Flight[], now: number = Date.now()): Flight[] {
  return [...flights].sort((a, b) => {
    const aDep = a.departureTime.scheduled;
    const aArr = a.arrivalTime.scheduled;
    const bDep = b.departureTime.scheduled;
    const bArr = b.arrivalTime.scheduled;

    const aClosest = Math.min(Math.abs(aDep - now), Math.abs(aArr - now));
    const bClosest = Math.min(Math.abs(bDep - now), Math.abs(bArr - now));

    return aClosest - bClosest;
  });
}
