import { Flight } from "../lib/types.ts";

export function logFlights(flights: Flight[]) {
  clearConsole();
  console.log(`🛫 Flight Monitor [${new Date().toISOString()}]`);
  console.log(`${"-".repeat(70)}`);

  if (flights.length === 0) {
    console.log("  No flights detected in the bounds");
  } else {
    flights.forEach((flight: any, i: number) => {
      const dep = formatDep(flight.schedule.departure);
      const arr = formatArr(flight.schedule.arrival);
      console.log(
        `  ${i + 1}. ${flight.flightNumber} ${flight.callsign} | ${
          flight.route.origin.iata
        }→${flight.route.destination.iata} | ${flight.aircraft.modelCode} "${
          flight.aircraft.modelText
        }" ${flight.aircraft.registration} | ${formatAltitude(
          flight.metrics.altitude
        )} ${flight.metrics.groundSpeed}kts ${
          flight.metrics.heading
        }° | ${dep}, ${arr}`
      );
    });
  }
}

function formatDep(departure: any): string {
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

function formatArr(arrival: any): string {
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
