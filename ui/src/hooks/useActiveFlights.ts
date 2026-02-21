import { useCallback, useEffect, useRef, useState } from "react";
import type { Flight } from "@/types/flight.ts";
import { usePageVisibility } from "./usePageVisibility.ts";

export default function useActiveFlights() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isPageVisible = usePageVisibility();
  const isPageVisibleRef = useRef(isPageVisible);

  useEffect(() => {
    isPageVisibleRef.current = isPageVisible;
  }, [isPageVisible]);

  const fetchFlights = async (force?: boolean) => {
    if (!isPageVisibleRef.current && !force) return;
    try {
      setLoading(true);
      const response = await fetch("/api/flights/active");
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      setFlights(sortFlights(data));
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch flights";
      setError(message);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights(true);
    const interval = setInterval(fetchFlights, 5000);
    return () => clearInterval(interval);
  }, []);

  return { flights, loading, error };
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
