import { useEffect, useState } from "react";
import type { Bounds } from "@/types/bounds.ts";
import Map from "@/components/Map.tsx";

interface Props {
  bounds: Bounds | null;
  isCreating: boolean;
  onSave: (bounds: Bounds) => void;
  onDelete: (id: number) => void;
}

const EMPTY_BOUNDS: Bounds = {
  id: -1,
  isActive: false,
  label: "",
  latitudeMax: 0,
  latitudeMin: 0,
  longitudeMax: 0,
  longitudeMin: 0,
};

export default function BoundsDetail({
  bounds,
  isCreating,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<Bounds | null>(
    isCreating ? EMPTY_BOUNDS : bounds ?? null
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isCreating) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(EMPTY_BOUNDS);
    } else {
      setDraft(bounds ?? null);
    }
    setDirty(false);
  }, [bounds, isCreating]);

  if (!draft) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-sm text-slate-500">
        <p>Select a bounding box from the list or create a new one.</p>
      </div>
    );
  }

  const handleFieldChange = <K extends keyof Bounds>(
    key: K,
    value: Bounds[K]
  ) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  };

  const handleCoordsChangeFromMap = (coords: {
    latitudeMax: number;
    latitudeMin: number;
    longitudeMax: number;
    longitudeMin: number;
  }) => {
    setDraft((prev) =>
      prev ? { ...prev, ...coords } : { ...EMPTY_BOUNDS, ...coords }
    );
    setDirty(true);
  };

  const handleDiscard = () => {
    if (isCreating) {
      setDraft(EMPTY_BOUNDS);
    } else {
      setDraft(bounds ?? null);
    }
    setDirty(false);
  };

  const handleSaveClick = () => {
    if (!draft.label.trim()) {
      return;
    }
    const id = bounds?.id ?? -1;
    const updated: Bounds = {
      id,
      label: draft.label.trim(),
      isActive: draft.isActive,
      latitudeMax: draft.latitudeMax,
      latitudeMin: draft.latitudeMin,
      longitudeMax: draft.longitudeMax,
      longitudeMin: draft.longitudeMin,
    };
    onSave(updated);
    setDirty(false);
  };

  const title = isCreating ? "New bounding box" : draft.label || "Untitled box";

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
      <header className="flex items-center justify-between border-b pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {dirty && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                Unsaved changes
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isCreating && bounds && (
            <button
              type="button"
              onClick={() => {
                const cloned: Bounds = {
                  ...bounds,
                  label: `${bounds.label} copy`,
                  isActive: false,
                };
                onSave(cloned);
              }}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Clone
            </button>
          )}
          {!isCreating && bounds && (
            <button
              type="button"
              onClick={() => onDelete(bounds.id)}
              className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </header>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
        <Map bounds={draft} onChangeFromMap={handleCoordsChangeFromMap} />

        <form
          className="flex flex-1 flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveClick();
          }}
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Label
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={draft.label}
                  onChange={(e) => handleFieldChange("label", e.target.value)}
                  placeholder="e.g. Helsinki Center"
                  required
                />
              </div>

              <fieldset className="space-y-1.5">
                <legend className="text-xs font-medium text-slate-700">
                  Active status
                </legend>
                <div className="space-y-2 text-xs text-slate-600">
                  <label className="flex items-start gap-2">
                    <input
                      type="radio"
                      className="mt-0.5"
                      checked={draft.isActive}
                      onChange={() => handleFieldChange("isActive", true)}
                    />
                    <span>
                      Set as active bounding box
                      <span className="block text-[11px] text-slate-500">
                        Only one bounding box can be active at a time.
                        Activating this will deactivate the current one.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      className="mt-0.5"
                      checked={!draft.isActive}
                      onChange={() => handleFieldChange("isActive", false)}
                    />
                    <span>Leave inactive</span>
                  </label>
                </div>
              </fieldset>
            </div>

            <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">
                  Coordinates
                </span>
                <span className="text-[11px] text-slate-500">
                  Auto-updated from the map.
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-600">
                    North
                  </label>
                  <input
                    readOnly
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                    value={draft.latitudeMax.toFixed(5)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-600">
                    South
                  </label>
                  <input
                    readOnly
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                    value={draft.latitudeMin.toFixed(5)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-600">
                    East
                  </label>
                  <input
                    readOnly
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                    value={draft.longitudeMax.toFixed(5)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-600">
                    West
                  </label>
                  <input
                    readOnly
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                    value={draft.longitudeMin.toFixed(5)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto flex justify-between border-t pt-3">
            <button
              type="button"
              onClick={handleDiscard}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Discard
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={!draft.label.trim()}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
