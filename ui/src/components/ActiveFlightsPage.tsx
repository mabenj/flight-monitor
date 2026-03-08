/* eslint-disable react-hooks/purity */
import useActiveFlights from "@/hooks/useActiveFlights.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { prettyNumber } from "../lib/utils.ts";
import useBounds from "../hooks/useBounds.ts";
import { useMemo } from "react";
import useWeather from "../hooks/useWeather.ts";
import type { Weather } from "@/types/Weather.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Thermometer, Wind, Clock, MapPin, AlertCircle } from "lucide-react";

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

function getSkyConditionColor(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("clear") || c.includes("skc") || c.includes("cavok"))
    return "text-sky-500";
  if (c.includes("few")) return "text-blue-400";
  if (c.includes("scattered") || c.includes("sct")) return "text-blue-500";
  if (c.includes("broken") || c.includes("bkn")) return "text-slate-500";
  if (c.includes("overcast") || c.includes("ovc")) return "text-slate-600";
  return "text-slate-500";
}

function getSkyConditionIcon(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("clear") || c.includes("skc") || c.includes("cavok"))
    return "☀️";
  if (c.includes("few")) return "🌤️";
  if (c.includes("scattered") || c.includes("sct")) return "⛅";
  if (c.includes("broken") || c.includes("bkn")) return "🌥️";
  if (c.includes("overcast") || c.includes("ovc")) return "☁️";
  if (c.includes("storm") || c.includes("ts")) return "⛈️";
  if (c.includes("rain") || c.includes("ra")) return "🌧️";
  if (c.includes("snow") || c.includes("sn")) return "🌨️";
  return "🌡️";
}

function WeatherCard({ weather }: { weather: Weather }) {
  const metarAge = useMemo(() => {
    const diffMs = Date.now() - weather.timestamp * 1000;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin === 1) return "1 min ago";
    return `${diffMin} min ago`;
  }, [weather.timestamp]);

  const isStale = Date.now() - weather.timestamp * 1000 > 60 * 60 * 1000;

  return (
    <div className="mb-4 rounded-lg border bg-white shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Weather
          </span>
          <Badge
            variant="outline"
            className="text-xs px-1.5 py-0 h-5 font-mono"
          >
            {weather.airportIcao}
          </Badge>
          <span className="text-xs text-slate-400">/</span>
          <Badge
            variant="outline"
            className="text-xs px-1.5 py-0 h-5 font-mono"
          >
            {weather.airportIata}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{metarAge}</span>
          {isStale && (
            <div title="METAR data may be outdated">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 ml-1" />
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6 px-4 py-3">
        {/* Temperature */}
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-rose-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-400 leading-none mb-0.5">Temp</p>
            <p className="text-sm font-semibold text-slate-800">
              {weather.tempCelsius}°C
              <span className="text-xs font-normal text-slate-400 ml-1">
                ({Math.round((weather.tempCelsius * 9) / 5 + 32)}°F)
              </span>
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-100" />

        {/* Sky condition */}
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">
            {getSkyConditionIcon(weather.skyCondition)}
          </span>
          <div>
            <p className="text-xs text-slate-400 leading-none mb-0.5">Sky</p>
            <p
              className={`text-sm font-semibold ${getSkyConditionColor(
                weather.skyCondition
              )}`}
            >
              {weather.skyCondition}
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-100" />

        {/* METAR raw */}
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <Wind className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-slate-400 leading-none mb-0.5">METAR</p>
            <p
              className="text-xs font-mono text-slate-600 truncate max-w-xs cursor-help"
              title={weather.metar}
            >
              {weather.metar}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActiveFlightsPage() {
  const { flights, loading, error } = useActiveFlights();
  const { bounds } = useBounds();
  const weather: Weather | null = useWeather();
  const activeBounds = useMemo(() => bounds?.find((b) => b.isActive), [bounds]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        {error}
      </div>
    );
  }

  if (loading && flights.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 h-full overflow-auto">
      {/* Page header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold text-slate-900">
            Active flights
          </div>
          {activeBounds && (
            <>
              <span className="text-slate-400">|</span>
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                {activeBounds.label}
              </span>
            </>
          )}
        </div>
        <p className="text-sm text-slate-500">{flights.length} flights</p>
      </div>

      {/* Weather card */}
      {weather && <WeatherCard weather={weather} />}

      {/* Flights table */}
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
                <Th>Callsign</Th>
                <Th>Airline</Th>
                <Th>From</Th>
                <Th>To</Th>
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
                  <Td>{flight.callsign}</Td>
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
