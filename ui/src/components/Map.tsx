import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { useEffect, useRef } from "react";
import DrawRectangle from "mapbox-gl-draw-rectangle-mode";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

const STYLES = {
  default: "mapbox://styles/mabenj/cmkh9llcn00bc01qudp775fuc",
  dark2D: "mapbox://styles/mabenj/cmkh9ghkl00dx01r1b6a4a7o6",
  satellite: "mapbox://styles/mabenj/cmkh9itbi005b01sf3e9jcwei",
};

export default function Map() {
  const mapRef = useRef<mapboxgl.Map>(null);
  const drawRef = useRef<MapboxDraw>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
      throw new Error("VITE_MAPBOX_ACCESS_TOKEN is not set");
    }

    const setToCurrentLocation = async () => {
      const response = await fetch("http://ip-api.com/json");
      const { lat, lon } = await response.json();
      if (lat == null || lon == null) {
        return;
      }
      mapRef.current?.setCenter([lon, lat]);
      mapRef.current?.setZoom(9);
    };

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
      style: STYLES.default,
      antialias: true,
      attributionControl: false,
      performanceMetricsCollection: false,
    });

    const modes = MapboxDraw.modes;
    // deno-lint-ignore no-explicit-any
    (modes as any).draw_rectangle = DrawRectangle;
    drawRef.current = new MapboxDraw({
      // deno-lint-ignore no-explicit-any
      modes: modes as any,
    });
    mapRef.current.addControl(drawRef.current);
    drawRef.current.changeMode("draw_rectangle");

    setToCurrentLocation();

    mapRef.current.on("draw.create", (feature) => {
      console.log(feature);
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return (
    <>
      <div
        ref={mapContainerRef}
        id="map-container"
        style={{ width: "600px", height: "500px" }}
        className="border-red-500 border"
      />
    </>
  );
}
