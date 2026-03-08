import { useEffect, useRef, useState } from "react";
import type { Weather } from "@/types/Weather.ts";
import useBounds from "./useBounds.ts";
import { usePageVisibility } from "./usePageVisibility.ts";

export default function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const { bounds } = useBounds();
  const isPageVisible = usePageVisibility();
  const isPageVisibleRef = useRef(isPageVisible);

  useEffect(() => {
    isPageVisibleRef.current = isPageVisible;
  }, [isPageVisible]);

  const fetchWeather = async (icao: string, force?: boolean) => {
    if (!isPageVisibleRef.current && !force) return;
    try {
      const response = await fetch(`/api/weather/${icao}`);
      if (response.status === 404) {
        setWeather(null);
        return;
      }
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      console.error("Failed to fetch weather:", err);
      setWeather(null);
    }
  };

  useEffect(() => {
    const activeBounds = bounds?.find((b) => b.isActive && b.airportCode);
    if (!activeBounds?.airportCode) {
      setWeather(null);
      return;
    }

    fetchWeather(activeBounds.airportCode, true);
    const interval = setInterval(
      () => fetchWeather(activeBounds!.airportCode!),
      5000
    );
    return () => clearInterval(interval);
  }, [bounds]);

  return weather;
}
