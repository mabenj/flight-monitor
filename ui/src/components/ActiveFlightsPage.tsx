import useActiveFlights from "@/hooks/useActiveFlights.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { prettyNumber } from "../lib/utils.ts";

function formatTime(timestamp: number | undefined): string {
  if (!timestamp) return "";
  const time = new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return time + "Z";
}

function formatAltitude(alt: number): string {
  return alt >= 18000
    ? `FL${prettyNumber(Math.round(alt / 100))}`
    : `${prettyNumber(alt)} ft`;
}

export default function ActiveFlightsPage() {
  const { flights, loading } = useActiveFlights();

  if (loading && flights.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 h-full overflow-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Active flights</h2>
        <p className="text-sm text-slate-500">{flights.length} flights</p>
      </div>

      {flights.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-500">
          No active flights
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-md bg-white">
          <table className="w-full text-xs">
            <thead className="border-b bg-slate-50">
              <tr>
                <Th>Flight #</Th>
                <Th>Airline</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Callsign</Th>
                <Th>Aircraft</Th>
                <Th>Registration</Th>
                <Th center>Alt.</Th>
                <Th center>Speed</Th>
                <Th center>Hdg.</Th>
                <Th>Departure</Th>
                <Th>Arrival</Th>
              </tr>
            </thead>
            <tbody>
              {flights.map((flight) => (
                <tr
                  key={flight.id}
                  className="border-b hover:bg-slate-50 transition-colors"
                >
                  <Td bold>{flight.flightNumber}</Td>
                  <Td title={flight.airline?.icao}>{flight.airline?.name}</Td>
                  <Td>
                    {flight.origin?.name ? (
                      <div title={flight.origin.icao}>
                        <span>{flight.origin.name}</span>
                        <span className="font-medium ml-1 text-slate-400">
                          ({flight.origin.iata})
                        </span>
                      </div>
                    ) : (
                      <NA />
                    )}
                  </Td>
                  <Td>
                    {flight.destination?.name ? (
                      <div title={flight.destination.icao}>
                        <span>{flight.destination.name}</span>
                        <span className="font-medium ml-1 text-slate-400">
                          ({flight.destination.iata})
                        </span>
                      </div>
                    ) : (
                      <NA />
                    )}
                  </Td>
                  <Td>{flight.callsign}</Td>
                  <Td title={flight.aircraft.modelCode}>
                    {flight.aircraft?.modelText}
                  </Td>
                  <Td>{flight.aircraft?.registration}</Td>
                  <Td center>{formatAltitude(flight.altitude)}</Td>
                  <Td center>{Math.round(flight.groundSpeed)} kts</Td>
                  <Td center>{flight.heading}°</Td>
                  <Td>
                    {flight.departureTime?.scheduled > 0 ? (
                      <>
                        <span>
                          {formatTime(flight.departureTime.scheduled)}
                        </span>
                        {flight.departureTime?.actual > 0 &&
                          !flight.departureTime?.estimated && (
                            <span className="ml-1 text-slate-400">
                              (Act. {formatTime(flight.departureTime.actual)})
                            </span>
                          )}
                        {flight.departureTime?.estimated > 0 &&
                          !flight.departureTime?.actual && (
                            <span className="ml-1 text-slate-400">
                              (Est. {formatTime(flight.departureTime.estimated)}
                              )
                            </span>
                          )}
                      </>
                    ) : (
                      <NA />
                    )}
                  </Td>
                  <Td>
                    {flight.arrivalTime?.scheduled > 0 ? (
                      <>
                        <span>{formatTime(flight.arrivalTime.scheduled)}</span>
                        {flight.arrivalTime?.actual > 0 &&
                          !flight.arrivalTime?.estimated && (
                            <span className="ml-1 text-slate-400">
                              (Act. {formatTime(flight.arrivalTime.actual)})
                            </span>
                          )}
                        {flight.arrivalTime?.estimated > 0 &&
                          !flight.arrivalTime?.actual && (
                            <span className="ml-1 text-slate-400">
                              (Est. {formatTime(flight.arrivalTime.estimated)})
                            </span>
                          )}
                      </>
                    ) : (
                      <NA />
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const Th = ({
  children,
  center,
}: {
  children: React.ReactNode;
  center?: boolean;
}) => (
  <th
    className={
      "px-3 py-2 font-medium text-slate-700" +
      (center ? " text-center" : " text-left")
    }
  >
    {children}
  </th>
);

const Td = ({
  children,
  center,
  bold,
  title,
}: {
  children: React.ReactNode;
  center?: boolean;
  bold?: boolean;
  title?: string;
}) => (
  <td
    className={
      "px-3 py-2 text-slate-700" +
      (center ? " text-center" : " text-left") +
      (bold ? " font-semibold " : "")
    }
    title={title}
  >
    {children || <NA />}
  </td>
);

const NA = () => <span className="text-slate-400 italic font-normal">N/A</span>;
