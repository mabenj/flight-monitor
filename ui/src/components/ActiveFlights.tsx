import useActiveFlights from "@/hooks/useActiveFlights.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

function formatTime(timestamp: number | undefined): string {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatAltitude(altitude: number): string {
  return `${Math.round(altitude / 100)}`;
}

export default function ActiveFlights() {
  const { flights, loading } = useActiveFlights();

  if (loading && flights.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 h-full overflow-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Active Flights</h2>
        <p className="text-sm text-slate-500">{flights.length} flights</p>
      </div>

      {flights.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-500">
          No active flights
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-md bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-700">
                  Flight #
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">
                  Callsign
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">
                  Route
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">
                  Aircraft
                </th>
                <th className="px-4 py-2 text-center font-medium text-slate-700">
                  Alt (FL)
                </th>
                <th className="px-4 py-2 text-center font-medium text-slate-700">
                  Speed (kts)
                </th>
                <th className="px-4 py-2 text-center font-medium text-slate-700">
                  Hdg (°)
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">
                  Departure
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">
                  Arrival
                </th>
              </tr>
            </thead>
            <tbody>
              {flights.map((flight) => (
                <tr
                  key={flight.id}
                  className="border-b hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {flight.flightNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {flight.callsign}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {flight.origin?.iata || "-"} →{" "}
                    {flight.destination?.iata || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {flight.aircraft?.modelText || "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-700">
                    {formatAltitude(flight.altitude)}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-700">
                    {Math.round(flight.groundSpeed)}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-700">
                    {flight.heading}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>
                      Sch: {formatTime(flight.departureTime?.scheduled)}
                    </div>
                    <div>
                      Est: {formatTime(flight.departureTime?.estimated)}
                    </div>
                    <div>Act: {formatTime(flight.departureTime?.actual)}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>Sch: {formatTime(flight.arrivalTime?.scheduled)}</div>
                    <div>Est: {formatTime(flight.arrivalTime?.estimated)}</div>
                    <div>Act: {formatTime(flight.arrivalTime?.actual)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
