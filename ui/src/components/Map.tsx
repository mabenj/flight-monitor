import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
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

export default function Map(props: Props) {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100">
      <MapContainer
        center={[0, 0]}
        zoom={13}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInner {...props} />
      </MapContainer>
    </div>
  );
}

const MapInner = ({ bounds, onChangeFromMap }: Props) => {
  const map = useMap();

  useEffect(() => {
    const setToCurrentLocation = async () => {
      const response = await fetch("http://ip-api.com/json");
      const { lat, lon } = await response.json();
      if (lat == null || lon == null) {
        return;
      }
      map.setView([lat, lon], 9);
    };

    setToCurrentLocation();
  }, [map]);

  return null;
};
