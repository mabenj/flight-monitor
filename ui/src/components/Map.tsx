import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl, { GeoJSONSource, MapMouseEvent } from "mapbox-gl";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "./ui/button.tsx";
import { LocateIcon, SquareDashedIcon, XIcon } from "lucide-react";

interface Props {
  selectedId: number | null;
  diagonal: [Point, Point] | null;
  onDiagonalChange: (diagonal: [Point, Point] | null) => void;
  initialLocation?: Point;
}

const STYLES = {
  default: "mapbox://styles/mabenj/cmkh9llcn00bc01qudp775fuc",
  dark2D: "mapbox://styles/mabenj/cmkh9ghkl00dx01r1b6a4a7o6",
  satellite: "mapbox://styles/mabenj/cmkh9itbi005b01sf3e9jcwei",
};

export type Point = {
  x: number;
  y: number;
};

type RectangleState = {
  id: number | null;
  anchorPoint: Point | null;
  diagonalPoint: Point | null;
  isDrawing: boolean;
  isResizing: boolean;
  activeCorner: CornerId | null;
};

type CornerId = "SW" | "SE" | "NE" | "NW";

export default function Map({
  selectedId,
  diagonal,
  onDiagonalChange,
  initialLocation,
}: Props) {
  const mapRef = useRef<mapboxgl.Map>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const rectStateRef = useRef<RectangleState>({
    id: selectedId,
    anchorPoint: null,
    diagonalPoint: null,
    isDrawing: false,
    isResizing: false,
    activeCorner: null,
  });

  const startRectangle = useCallback(() => {
    rectStateRef.current.isDrawing = true;
    rectStateRef.current.anchorPoint = null;
    rectStateRef.current.activeCorner = null;
    mapRef.current!.getCanvas().style.cursor = "crosshair";
  }, []);

  const clearRectangle = useCallback(() => {
    rectStateRef.current.isDrawing = false;
    rectStateRef.current.isResizing = false;
    rectStateRef.current.anchorPoint = null;
    rectStateRef.current.activeCorner = null;
    onDiagonalChange(null);

    if (!mapRef.current) {
      return;
    }
    mapRef.current.getCanvas().style.cursor = "";

    (mapRef.current.getSource("rect-src") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: [],
    });
    (mapRef.current.getSource("rect-corners-src") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flyToDiagonal = (diag: [Point, Point] | null, durationMs = 2000) => {
    if (!diag) {
      return;
    }
    const [a, b] = diag;
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);

    const bounds = [
      [minX, minY],
      [maxX, maxY],
    ] as [[number, number], [number, number]];
    const padding = 200;
    mapRef.current!.fitBounds(bounds, { padding, duration: durationMs });
  };

  const renderRectangle = useCallback(async () => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    while (!map.loaded()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const { anchorPoint, diagonalPoint } = rectStateRef.current;
    (map.getSource("rect-corners-src") as GeoJSONSource)?.setData(
      cornersFeatureCollection(anchorPoint, diagonalPoint)
    );
    const rectFC =
      anchorPoint && diagonalPoint
        ? {
            type: "FeatureCollection" as const,
            features: [
              rectangleFromOppositeCorners(anchorPoint, diagonalPoint),
            ],
          }
        : { type: "FeatureCollection" as const, features: [] };
    (map.getSource("rect-src") as GeoJSONSource)?.setData(rectFC);
  }, []);

  const emitRectangle = useCallback(() => {
    const { anchorPoint, diagonalPoint } = rectStateRef.current;
    if (!anchorPoint || !diagonalPoint) {
      return;
    }
    onDiagonalChange([anchorPoint, diagonalPoint]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const [anchorPoint, diagonalPoint] = diagonal ?? [null, null];
    if (
      !anchorPoint ||
      !diagonalPoint ||
      isNaN(anchorPoint.x) ||
      isNaN(anchorPoint.y) ||
      isNaN(diagonalPoint.x) ||
      isNaN(diagonalPoint.y)
    ) {
      clearRectangle();
      return;
    }
    rectStateRef.current.anchorPoint = anchorPoint;
    rectStateRef.current.diagonalPoint = diagonalPoint;
    renderRectangle();

    if (rectStateRef.current.id === selectedId) {
      return;
    }
    rectStateRef.current.id = selectedId;
    if (!selectedId) {
      return;
    }
    flyToDiagonal(diagonal);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagonal]);

  useEffect(() => {
    if (!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
      throw new Error("VITE_MAPBOX_ACCESS_TOKEN is not set");
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
      style: STYLES.satellite,
      antialias: true,
      attributionControl: false,
      performanceMetricsCollection: false,
      center: [initialLocation?.x ?? -0.12, initialLocation?.y ?? 51.5],
      zoom: 8,
    });
    mapRef.current = map;
    flyToDiagonal(diagonal, 0);
    map.on("load", () => {
      map.addSource("rect-src", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "rect-fill",
        type: "fill",
        source: "rect-src",
        paint: {
          "fill-color": "#0080ff",
          "fill-opacity": 0.5,
        },
      });
      map.addLayer({
        id: "rect-outline",
        type: "line",
        source: "rect-src",
        paint: {
          "line-color": "#0080ff",
          "line-opacity": 1,
          "line-width": 2,
        },
      });

      map.addSource("rect-corners-src", {
        type: "geojson",
        data: cornersFeatureCollection(null, null),
      });
      map.addLayer({
        id: "rect-corners",
        type: "circle",
        source: "rect-corners-src",
        paint: {
          "circle-radius": 6,
          "circle-color": "#0080ff",
          "circle-opacity": 1,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1,
        },
      });
    });

    const onClick = (e: MapMouseEvent) => {
      if (!rectStateRef.current.isDrawing) {
        return;
      }

      const { lng, lat } = e.lngLat;
      if (rectStateRef.current.anchorPoint === null) {
        rectStateRef.current.anchorPoint = { x: lng, y: lat };
        return;
      }

      rectStateRef.current.isDrawing = false;
      rectStateRef.current.diagonalPoint = { x: lng, y: lat };
      mapRef.current!.getCanvas().style.cursor = "";
      renderRectangle();
      emitRectangle();
    };

    const onMouseMove = (e: MapMouseEvent) => {
      if (!rectStateRef.current.isDrawing && !rectStateRef.current.isResizing) {
        return;
      }
      const { lng, lat } = e.lngLat;
      const { anchorPoint } = rectStateRef.current;
      if (!anchorPoint) {
        return;
      }
      rectStateRef.current.diagonalPoint = { x: lng, y: lat };
      renderRectangle();
      emitRectangle();
    };

    const onMouseEnterRectCorner = () => {
      map.getCanvasContainer().style.cursor = "move";
    };

    const onMouseLeaveRectCorner = () => {
      map.getCanvasContainer().style.cursor = "";
    };

    const onMouseUpRectCorner = (e: MapMouseEvent) => {
      e.preventDefault();
      if (!rectStateRef.current.isResizing) {
        return;
      }
      rectStateRef.current.isResizing = false;
      const { lng, lat } = e.lngLat;
      const { anchorPoint } = rectStateRef.current;
      if (!anchorPoint) {
        return;
      }
      rectStateRef.current.diagonalPoint = { x: lng, y: lat };
      renderRectangle();
      emitRectangle();
    };

    const onMouseDownRectCorner = (e: MapMouseEvent) => {
      e.preventDefault();

      const f = e.features?.[0];
      const cornerId = f?.properties?.cornerId as CornerId | undefined;
      if (!cornerId) {
        return;
      }

      // get current rectangle corners
      const source = map.getSource("rect-src") as GeoJSONSource;
      const data = source._data as GeoJSON.FeatureCollection;
      const features = data.features;
      const rectangleFeature = features[0];
      const geometry = rectangleFeature.geometry as GeoJSON.Polygon;
      const coordinates = geometry.coordinates[0];
      const oppositeCorner = getOppositeCorner(
        cornerId,
        coordinates.map((coord) => ({ x: coord[0], y: coord[1] }))
      );

      rectStateRef.current.isResizing = true;
      rectStateRef.current.activeCorner = cornerId;
      rectStateRef.current.anchorPoint = oppositeCorner;

      map.getCanvasContainer().style.cursor = "grab";
      map.once("mouseup", onMouseUpRectCorner);
    };

    map.on("click", onClick);
    map.on("mousemove", onMouseMove);
    map.on("mouseenter", "rect-corners", onMouseEnterRectCorner);
    map.on("mouseleave", "rect-corners", onMouseLeaveRectCorner);
    map.on("mousedown", "rect-corners", onMouseDownRectCorner);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      map.off("click", onClick);
      map.off("mousemove", onMouseMove);
      map.off("mouseenter", "rect-corners", onMouseEnterRectCorner);
      map.off("mouseleave", "rect-corners", onMouseLeaveRectCorner);
      map.off("mousedown", "rect-corners", onMouseDownRectCorner);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-150 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100">
      <div
        ref={mapContainerRef}
        id="map-container"
        style={{ width: "100%", height: "100%" }}
      />
      <div className="absolute bottom-3 left-3 w-full flex justify-end pr-8 gap-2">
        <Button
          size="sm"
          variant="outline"
          type="button"
          className="rounded-full"
          onClick={() => flyToDiagonal(diagonal)}
          disabled={!diagonal}
        >
          <LocateIcon /> Re-center
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          className="rounded-full"
          onClick={startRectangle}
          disabled={rectStateRef.current.isDrawing}
        >
          <SquareDashedIcon /> Draw rectangle
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          className="rounded-full"
          onClick={clearRectangle}
        >
          <XIcon /> Clear
        </Button>
      </div>
    </div>
  );
}

function getOppositeCorner(cornerId: CornerId, coordinates: Point[]): Point {
  const xCoords = coordinates.map((p) => p.x);
  const yCoords = coordinates.map((p) => p.y);
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);

  switch (cornerId) {
    case "SW":
      return { x: maxX, y: maxY }; // NE
    case "SE":
      return { x: minX, y: maxY }; // NW
    case "NE":
      return { x: minX, y: minY }; // SW
    case "NW":
      return { x: maxX, y: minY }; // SE
  }
}

function rectangleFromOppositeCorners(a: Point, b: Point) {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  const ring = [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
    [minX, minY],
  ];
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [ring] },
  };
}

function cornersFeatureCollection(a: Point | null, b: Point | null) {
  if (!a || !b) {
    return { type: "FeatureCollection" as const, features: [] };
  }
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);

  const corners: Array<{ id: CornerId; coord: [number, number] }> = [
    { id: "SW", coord: [minX, minY] },
    { id: "SE", coord: [maxX, minY] },
    { id: "NE", coord: [maxX, maxY] },
    { id: "NW", coord: [minX, maxY] },
  ];

  return {
    type: "FeatureCollection" as const,
    features: corners.map((corner) => ({
      type: "Feature" as const,
      properties: { cornerId: corner.id },
      geometry: { type: "Point" as const, coordinates: corner.coord },
    })),
  };
}
