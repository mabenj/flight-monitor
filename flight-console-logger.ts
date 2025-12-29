import { Flight } from "./types.ts";

export function logFlights(flights: Flight[]) {
  clearConsole();
  console.log(
    `🛫 Flight Monitor [${new Date().toLocaleDateString("fi-FI", {
      timeZone: "Europe/Helsinki",
    })}]`
  );
  console.log(`${"-".repeat(70)}`);

  if (flights.length === 0) {
    console.log("  No flights detected in the bounds");
  } else {
    flights.forEach((flight: any, i: number) => {
      const dep = formatTimeCompact(flight.schedule.departure);
      const eta = formatTimeCompact(flight.schedule.arrival);
      console.log(
        `  ${i + 1}. ${flight.flightNumber} ${flight.airline.iata} ${
          flight.aircraft.modelCode
        } ${flight.route.origin.iata}→HEL ${formatAltitude(
          flight.metrics.altitude
        )} ${flight.metrics.groundSpeed}kts ETA:${eta}`
      );
    });
  }
}

function formatTimeCompact(schedule: any): string {
  const t = (unix: number | undefined) =>
    unix
      ? new Date(unix * 1000).toLocaleTimeString("fi-FI", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Helsinki",
        })
      : "───";
  return `${t(schedule.estimated) || t(schedule.scheduled)}`;
}

function formatAltitude(alt: number): string {
  return `${Math.round(alt / 100)}h`;
}

function clearConsole() {
  console.clear();
}
