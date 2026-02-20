import { useEffect, useState } from "react";

export function useIpLocation() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(
    null
  );

  useEffect(() => {
    fetchCurrentLocation()
      .then((data) => setLocation(data))
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return location;
}
async function fetchCurrentLocation() {
  const response = await fetch("http://ip-api.com/json");
  const { lat, lon } = await response.json();
  return { lat, lon };
}
