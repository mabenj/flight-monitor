import { useMemo, useState } from "react";
import BoundsList from "@/components/BoundsList.tsx";
import useBounds from "../hooks/useBounds.ts";
import BoundsDetail from "@/components/BoundsDetail.tsx";
import type { Bounds } from "@/types/bounds.ts";
import { Button } from "@/components/ui/button.tsx";
import { SquareStackIcon, PlusIcon } from "lucide-react";

export default function BoundsPage() {
  const { bounds, createBounds, updateBounds, deleteBounds } = useBounds();
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);
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

        <div className="px-4 pb-3">
          <Button
            size="sm"
            onClick={() => setSelectedId("new")}
            className="w-full justify-center"
          >
            <PlusIcon className="size-4 mr-2" /> New bounding box
          </Button>
        </div>

        <BoundsList
          bounds={bounds}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </aside>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50">
        {selectedId ? (
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
