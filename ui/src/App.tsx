import { useMemo, useState } from "react";
import "./App.css";
import BoundsList from "@/components/BoundsList.tsx";
import useBounds from "./hooks/useBounds.ts";
import BoundsDetail from "@/components/BoundsDetail.tsx";
import type { Bounds } from "@/types/bounds.ts";
import { Button } from "@/components/ui/button.tsx";
import { PlusIcon, SquareStackIcon } from "lucide-react";

function App() {
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
    <div className="flex h-dvh flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <h1 className="text-lg font-semibold text-slate-900">Flight Tracker</h1>
        <Button onClick={() => setSelectedId("new")}>
          <PlusIcon /> New bounding box
        </Button>
      </header>

      <main className="flex min-h-0 flex-1">
        <aside className="flex w-90 min-w-[18rem] flex-col border-r bg-white">
          <div className="flex items-center gap-2 px-4 py-3">
            <SquareStackIcon className="size-5" />
            <h2 className="text-sm font-medium text-slate-900">
              Bounding boxes
            </h2>
          </div>

          <BoundsList
            bounds={bounds}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <BoundsDetail
            bounds={selected}
            isCreating={selectedId === "new"}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
