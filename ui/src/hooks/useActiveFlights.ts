import { useEffect, useState } from "react";
import type { Flight } from "@types/flight.ts";
import { toast } from "sonner";

interface UseActiveFlightsReturn {
  flights: Flight[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export default function useActiveFlights(): UseActiveFlightsReturn {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/flights/active");
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setFlights(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch flights";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
    const interval = setInterval(fetchFlights, 5000);
    return () => clearInterval(interval);
  }, []);

  return { flights, loading, error, refresh: fetchFlights };
}
