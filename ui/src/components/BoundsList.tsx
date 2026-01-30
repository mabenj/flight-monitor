import type { Bounds } from "@/types/bounds.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

interface Props {
  bounds: Bounds[] | null;
  selectedId: number | "new" | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function BoundsList({
  bounds,
  selectedId,
  onSelect,
  onDelete,
}: Props) {
  if (!bounds) {
    // Loading state
    return (
      <div className="flex flex-1 gap-2 items-center justify-center px-4 text-center text-xs text-slate-500">
        <Spinner />
        <p className="font-medium text-slate-700">Loading...</p>
      </div>
    );
  }

  if (bounds.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-700">No bounding boxes yet</p>
        <p className="mt-1">
          Create your first bounding box to define the area of interest.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 pb-2">
      <ul className="space-y-1">
        {bounds.map((bound) => {
          const isSelected = bound.id === selectedId;
          return (
            <li key={bound.id}>
              <div
                onClick={() => onSelect(bound.id)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition ${
                  isSelected
                    ? "border-blue-200 bg-blue-50"
                    : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-slate-900">
                      {bound.label}
                    </span>
                    {bound.isActive && (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        Active
                      </span>
                    )}
                    {!bound.isActive && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    N {bound.latitudeMax.toFixed(3)} · S{" "}
                    {bound.latitudeMin.toFixed(3)} · E{" "}
                    {bound.longitudeMax.toFixed(3)} · W{" "}
                    {bound.longitudeMin.toFixed(3)}
                  </p>
                </div>
                <div className="ml-2 flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(bound.id);
                    }}
                    className="rounded p-1 text-[10px] text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
