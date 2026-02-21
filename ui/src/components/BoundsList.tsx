import type { Bounds } from "@/types/bounds.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item.tsx";
import { Badge } from "@/components/ui/badge.tsx";

interface Props {
  bounds: Bounds[] | null;
  selectedId: number | "new" | null;
  onSelect: (id: number) => void;
}

export default function BoundsList({ bounds, selectedId, onSelect }: Props) {
  if (!bounds) {
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
      <ul className="space-y-3">
        {bounds.map((bound) => {
          const isSelected = bound.id === selectedId;
          return (
            <li key={bound.id}>
              <Item
                variant="outline"
                className={`cursor-pointer ${
                  isSelected
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                    : "hover:bg-accent dark:hover:bg-accent"
                }`}
                onClick={() => onSelect(bound.id)}
              >
                <ItemContent>
                  <ItemTitle>
                    <div className="flex items-center gap-2">
                      <span>{bound.label}</span>
                      {bound.isActive && (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                  </ItemTitle>
                  <ItemDescription className="text-xs">
                    N {bound.latitudeMax.toFixed(3)} · S{" "}
                    {bound.latitudeMin.toFixed(3)} · E{" "}
                    {bound.longitudeMax.toFixed(3)} · W{" "}
                    {bound.longitudeMin.toFixed(3)}
                  </ItemDescription>
                </ItemContent>
              </Item>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
