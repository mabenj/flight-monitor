// deno-lint-ignore-file no-explicit-any
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { useEffect, useRef } from "react";
import DrawRectangle from "mapbox-gl-draw-rectangle-mode";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type { Bounds } from "@/types/bounds.ts";

interface Props {
  bounds: Bounds;
  onChangeFromMap: (
    coords: Pick<
      Bounds,
      "latitudeMax" | "latitudeMin" | "longitudeMax" | "longitudeMin"
    >
  ) => void;
}

const STYLES = {
  default: "mapbox://styles/mabenj/cmkh9llcn00bc01qudp775fuc",
  dark2D: "mapbox://styles/mabenj/cmkh9ghkl00dx01r1b6a4a7o6",
  satellite: "mapbox://styles/mabenj/cmkh9itbi005b01sf3e9jcwei",
};

export default function Map({ bounds, onChangeFromMap }: Props) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (MapboxDraw.modes as any).draw_rectangle = DrawRectangle;
    drawRef.current = new MapboxDraw();
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
    <div className="relative h-64 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100">
      <div
        ref={mapContainerRef}
        id="map-container"
        style={{ width: "100%", height: "100%" }}
      />
      <div className="absolute bottom-3 left-3 w-full flex justify-end pr-8 gap-2">
        <button
          type="button"
          className="rounded bg-white px-2 py-1 text-[11px] text-slate-700 shadow"
        >
          Draw rectangle
        </button>
        <button
          type="button"
          className="rounded bg-white px-2 py-1 text-[11px] text-slate-700 shadow"
        >
          Edit
        </button>
        <button
          type="button"
          className="rounded bg-white px-2 py-1 text-[11px] text-slate-700 shadow"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

/**<div
        ref={mapContainerRef}
        id="map-container"
        style={{ width: "600px", height: "500px" }}
      /> */
