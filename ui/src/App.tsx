import { useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import "./App.css";
import BoundsList from "@/components/BoundsList.tsx";
import useBounds from "./hooks/useBounds.ts";
import BoundsDetail from "@/components/BoundsDetail.tsx";
import ActiveFlights from "@/components/ActiveFlights.tsx";
import type { Bounds } from "@/types/bounds.ts";
import { Button } from "@/components/ui/button.tsx";
import { SquareStackIcon, Plane } from "lucide-react";

function BoundsPage() {
  const { bounds, createBounds, updateBounds, deleteBounds } = useBounds();
  const [selectedId, setSelectedId] = useState<number | "new" | null>("new");
  const selected = useMemo(
    () => bounds?.find((b) => b.id === selectedId) ?? null,
    [bounds, selectedId]
  );

  const handleSave = async (bounds: Bounds) => {
    if (selectedId === "new") {
      const newBounds = await createBounds(bounds);
      setSelectedId(newBounds.id);
    } else {
      await updateBounds(bounds);
    }
  };

  const handleDelete = async (id: number) => {
    if (selectedId === "new") {
      setSelectedId(null);
    } else {
      await deleteBounds(id);
      setSelectedId(null);
    }
  };

  return (
    <main className="flex min-h-0 flex-1">
      <aside className="flex w-90 min-w-[18rem] flex-col border-r bg-white">
        <div className="flex items-center gap-2 px-4 py-3">
          <SquareStackIcon className="size-5" />
          <h2 className="text-sm font-medium text-slate-900">Bounding boxes</h2>
        </div>

        <BoundsList
          bounds={bounds}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </aside>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50">
        {selected ? (
          <BoundsDetail
            bounds={selected}
            onSave={handleSave}
            onDelete={handleDelete}
            isCreating={selectedId === "new"}
          />
        ) : (
          <div className="flex items-center justify-center flex-1 text-slate-500">
            Select or create a bounding box
          </div>
        )}
      </section>
    </main>
  );
}

function Navigation() {
  const location = useLocation();
  const isFlights = location.pathname === "/";
  const isBounds = location.pathname === "/bounds";

  return (
    <nav className="flex gap-2">
      <Link to="/">
        <Button variant={isFlights ? "default" : "outline"} size="sm">
          <Plane className="size-4" /> Active Flights
        </Button>
      </Link>
      <Link to="/bounds">
        <Button variant={isBounds ? "default" : "outline"} size="sm">
          <SquareStackIcon className="size-4" /> Bounding Boxes
        </Button>
      </Link>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="flex h-dvh flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <h1 className="text-lg font-semibold text-slate-900">Flight Tracker</h1>
        <Navigation />
      </header>

      <Routes>
        <Route path="/" element={<ActiveFlights />} />
        <Route path="/bounds" element={<BoundsPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
