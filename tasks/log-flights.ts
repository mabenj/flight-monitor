import { DatabaseSync } from "node:sqlite";
import { Flight } from "../types/flight.ts";
import { FlightsService } from "../services/flights-service.ts";

export function logFlights(db: DatabaseSync) {
  const flightsService = new FlightsService(db);
  const flights = flightsService.getActiveFlights();
  printToConsole(flights);
}

function printToConsole(flights: Flight[]) {
  clearConsole();
  console.log(`🛫 Flight Monitor [${formatDate(new Date())}]`);
  console.log(`${"-".repeat(70)}`);

  if (flights.length === 0) {
    console.log("  No flights detected in the bounds");
  } else {
    flights.forEach((flight: Flight, i: number) => {
      const dep = formatDep(flight.departureTime);
      const arr = formatArr(flight.arrivalTime);
      console.log(
        `  ${i + 1}. ${flight.flightNumber} ${flight.callsign} | ${
          flight.origin.iata
        }→${flight.destination.iata} | ${flight.aircraft.modelCode} "${
          flight.aircraft.modelText
        }" ${flight.aircraft.registration} | ${formatAltitude(
          flight.altitude
        )} ${flight.groundSpeed}kts ${flight.heading}° | ${dep}, ${arr}`
      );
    });
  }
}

function formatDep(departure: Flight["departureTime"]): string {
  const sch = departure.scheduled
    ? new Date(departure.scheduled * 1000).toLocaleTimeString("fi-FI", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Helsinki",
      })
    : "───";
  const act = departure.actual
    ? new Date(departure.actual * 1000).toLocaleTimeString("fi-FI", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Helsinki",
      })
    : "";
  return act ? `STD: ${sch}, ATD: ${act}` : `STD: ${sch}`;
}

function formatArr(arrival: Flight["arrivalTime"]): string {
  const sch = arrival.scheduled
    ? new Date(arrival.scheduled * 1000).toLocaleTimeString("fi-FI", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Helsinki",
      })
    : "───";
  const est = arrival.estimated
    ? new Date(arrival.estimated * 1000).toLocaleTimeString("fi-FI", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Helsinki",
      })
    : "";
  return est ? `STA: ${sch}, ETA: ${est}` : `STA: ${sch}`;
}

function formatAltitude(alt: number): string {
  return alt >= 18000 ? `FL${Math.round(alt / 100)}` : `${alt}ft`;
}

function clearConsole() {
  console.clear();
}

function formatDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");

  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1); // Months: 0-11
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const MM = pad(date.getMinutes());
  const SS = pad(date.getSeconds());

  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
}
