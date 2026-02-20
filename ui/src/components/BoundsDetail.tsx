import { useEffect, useState } from "react";
import type { Bounds } from "@/types/bounds.ts";
import Map, { type Point } from "@/components/Map.tsx";
import { Button } from "./ui/button.tsx";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field.tsx";
import { Input } from "./ui/input.tsx";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group.tsx";
import { Badge } from "./ui/badge.tsx";
import { CopyIcon, RotateCcwIcon, SaveIcon, Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { clamp } from "../lib/utils.ts";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group.tsx";

interface Props {
  bounds: Bounds | null;
  isCreating: boolean;
  onSave: (bounds: Bounds) => void;
  onDelete: (id: number) => void;
  ipLocation?: { lat: number; lon: number } | null;
}

export default function BoundsDetail({
  bounds,
  isCreating,
  onSave,
  onDelete,
  ipLocation,
}: Props) {
  const [formValues, setFormValues] = useState({
    label: bounds?.label ?? "",
    isActive: bounds?.isActive ?? false,
    north: bounds?.latitudeMax,
    south: bounds?.latitudeMin,
    east: bounds?.longitudeMax,
    west: bounds?.longitudeMin,
    dirty: false,
  });
  const [mapDiagonal, setMapDiagonal] = useState<[Point, Point] | null>(
    bounds
      ? [
          { x: bounds.longitudeMin, y: bounds.latitudeMax },
          { x: bounds.longitudeMax, y: bounds.latitudeMin },
        ]
      : null
  );

  const reset = () => {
    if (isCreating) {
      setFormValues({
        label: "",
        isActive: false,
        north: undefined,
        south: undefined,
        east: undefined,
        west: undefined,
        dirty: false,
      });
      setMapDiagonal(null);
    } else {
      setFormValues({
        label: bounds?.label ?? "",
        isActive: bounds?.isActive ?? false,
        north: bounds?.latitudeMax,
        south: bounds?.latitudeMin,
        east: bounds?.longitudeMax,
        west: bounds?.longitudeMin,
        dirty: false,
      });
      if (bounds) {
        setMapDiagonal([
          { x: bounds.longitudeMin, y: bounds.latitudeMax },
          { x: bounds.longitudeMax, y: bounds.latitudeMin },
        ]);
      }
    }
  };

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds, isCreating]);

  const handleFieldChange = <K extends keyof typeof formValues>(
    key: K,
    value: (typeof formValues)[K]
  ) => {
    if (key === "north") {
      setFormValues((prev) => ({
        ...prev,
        south: prev.south && value ? Math.min(prev.south, +value) : prev.south,
        north: value ? +value : undefined,
        dirty: true,
      }));
      if (formValues.south && formValues.west && formValues.east && value) {
        setMapDiagonal([
          { x: formValues.west, y: formValues.south },
          { x: formValues.east, y: +value },
        ]);
      } else {
        setMapDiagonal(null);
      }
    } else if (key === "south") {
      setFormValues((prev) => ({
        ...prev,
        north: prev.north && value ? Math.max(prev.north, +value) : prev.north,
        south: value ? +value : undefined,
        dirty: true,
      }));
      if (formValues.north && formValues.west && formValues.east && value) {
        setMapDiagonal([
          { x: formValues.west, y: +value },
          { x: formValues.east, y: formValues.north },
        ]);
      } else {
        setMapDiagonal(null);
      }
    } else if (key === "east") {
      setFormValues((prev) => ({
        ...prev,
        west: prev.west && value ? Math.min(prev.west, +value) : prev.west,
        east: value ? +value : undefined,
        dirty: true,
      }));
      if (formValues.north && formValues.south && formValues.west && value) {
        setMapDiagonal([
          { x: formValues.west, y: formValues.south },
          { x: +value, y: formValues.north },
        ]);
      } else {
        setMapDiagonal(null);
      }
    } else if (key === "west") {
      setFormValues((prev) => ({
        ...prev,
        east: prev.east && value ? Math.max(prev.east, +value) : prev.east,
        west: value ? +value : undefined,
        dirty: true,
      }));
      if (formValues.north && formValues.south && formValues.east && value) {
        setMapDiagonal([
          { x: +value, y: formValues.south },
          { x: formValues.east, y: formValues.north },
        ]);
      } else {
        setMapDiagonal(null);
      }
    } else {
      setFormValues((prev) => ({ ...prev, [key]: value, dirty: true }));
    }
  };

  const handleMapDiagonalChange = (points: [Point, Point] | null) => {
    setMapDiagonal(points);
    if (!points) {
      setFormValues((prev) => ({
        ...prev,
        north: undefined,
        south: undefined,
        east: undefined,
        west: undefined,
        dirty: true,
      }));
      return;
    }
    setFormValues((prev) => ({
      ...prev,
      north: Math.max(points[0].y, points[1].y),
      south: Math.min(points[0].y, points[1].y),
      east: Math.max(points[0].x, points[1].x),
      west: Math.min(points[0].x, points[1].x),
      dirty: true,
    }));
  };

  const handleSaveClick = () => {
    if (
      !formValues.label.trim() ||
      formValues.north === undefined ||
      formValues.south === undefined ||
      formValues.east === undefined ||
      formValues.west === undefined
    ) {
      return;
    }
    const id = bounds?.id ?? -1;
    const updated: Bounds = {
      id,
      label: formValues.label.trim(),
      isActive: formValues.isActive,
      latitudeMax: formValues.north,
      latitudeMin: formValues.south,
      longitudeMax: formValues.east,
      longitudeMin: formValues.west,
    };
    onSave(updated);
    setFormValues((prev) => ({ ...prev, dirty: false }));
  };

  const title = isCreating
    ? "New bounding box"
    : formValues.label || "Untitled box";

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
      <header className="flex items-center justify-between border-b pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {formValues.dirty && (
              <Badge variant="outline" className="bg-amber-100 text-amber-700">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isCreating && bounds && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const cloned: Bounds = {
                  ...bounds,
                  label: `${bounds.label} copy`,
                  isActive: false,
                };
                onSave(cloned);
              }}
            >
              <CopyIcon /> Clone
            </Button>
          )}
          {!isCreating && bounds && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" size="sm" variant="destructive">
                  <Trash2Icon /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    this bounding box.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel size="sm" variant="outline">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(bounds.id)}
                  >
                    Yes, delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
        <Map
          selectedId={bounds?.id ?? null}
          diagonal={mapDiagonal}
          onDiagonalChange={handleMapDiagonalChange}
          initialLocation={
            ipLocation ? { x: ipLocation.lon, y: ipLocation.lat } : undefined
          }
        />

        <form
          className="flex flex-1 flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveClick();
          }}
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
              <Field>
                <FieldLabel htmlFor="label">Label</FieldLabel>
                <Input
                  id="label"
                  required
                  type="text"
                  placeholder="e.g. Helsinki city center"
                  value={formValues.label}
                  onChange={(e) => handleFieldChange("label", e.target.value)}
                />
              </Field>

              <FieldSet>
                <FieldLegend>
                  <span className="text-sm">Active status</span>
                </FieldLegend>
                <RadioGroup
                  value={formValues.isActive ? "active" : "inactive"}
                  onValueChange={(val: string) =>
                    handleFieldChange("isActive", val === "active")
                  }
                >
                  <Field orientation="horizontal">
                    <RadioGroupItem value="active" id="active" />
                    <FieldContent>
                      <FieldLabel htmlFor="active" className="cursor-pointer">
                        Set as active
                      </FieldLabel>
                      <FieldDescription className="text-sm">
                        Only one bounding box can be active at a time.
                        Activating this will deactivate the current one.
                      </FieldDescription>
                    </FieldContent>
                  </Field>

                  <Field orientation="horizontal">
                    <RadioGroupItem value="inactive" id="inactive" />
                    <FieldContent>
                      <FieldLabel htmlFor="inactive" className="cursor-pointer">
                        Leave inactive
                      </FieldLabel>
                    </FieldContent>
                  </Field>
                </RadioGroup>
              </FieldSet>
            </div>

            <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Coordinates
                </span>
                <span className="text-xs text-slate-500">
                  Auto-updated from the map
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <CoordinateInput
                    label="° N"
                    value={formValues.north}
                    onChange={(e) => handleFieldChange("north", e)}
                    min={-90}
                    max={90}
                  />
                </div>
                <div className="space-y-1">
                  <CoordinateInput
                    label="° S"
                    value={formValues.south}
                    onChange={(e) => handleFieldChange("south", e)}
                    min={-90}
                    max={90}
                  />
                </div>
                <div className="space-y-1">
                  <CoordinateInput
                    label="° E"
                    value={formValues.east}
                    onChange={(e) => handleFieldChange("east", e)}
                    min={-180}
                    max={180}
                  />
                </div>
                <div className="space-y-1">
                  <CoordinateInput
                    label="° W"
                    value={formValues.west}
                    onChange={(e) => handleFieldChange("west", e)}
                    min={-180}
                    max={180}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto flex justify-between border-t pt-3">
            <Button type="button" size="sm" variant="outline" onClick={reset}>
              <RotateCcwIcon /> Discard
            </Button>
            <Button type="submit" size="sm" disabled={!formValues.label.trim()}>
              <SaveIcon /> Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const CoordinateInput = ({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value?: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) => {
  const [stringValue, setStringValue] = useState(value?.toFixed(5) ?? "");

  useEffect(() => {
    const next = value;
    if (next?.toString() !== stringValue) {
      setStringValue(next?.toFixed(5) ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    let cleaned = raw.replace(/[^0-9.,+-]/g, "");
    cleaned = cleaned.replace(/,/g, ".");
    cleaned = cleaned.replace(/(?!^)[+-]/g, "");
    const firstDot = cleaned.indexOf(".");
    if (firstDot !== -1) {
      const before = cleaned.slice(0, firstDot + 1);
      const after = cleaned.slice(firstDot + 1).replace(/\./g, "");
      cleaned = before + after;
    }
    setStringValue(cleaned);

    if (!onChange) {
      return;
    }

    if (raw.trim() === "") {
      onChange(0);
      return;
    }

    const parsed = Number(raw.replace(",", "."));
    if (Number.isNaN(parsed)) {
      return;
    }
    onChange(clamp(parsed, min, max));
  }

  function handleBlur() {
    if (stringValue.trim() === "") {
      return;
    }

    const parsed = Number(stringValue.replace(",", "."));
    if (Number.isNaN(parsed)) {
      return;
    }

    onChange(clamp(parsed, min, max));
  }

  return (
    <InputGroup>
      <InputGroupInput
        inputMode="decimal"
        type="text"
        value={stringValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="E.g. 60.123"
        pattern="^[\-\+0-9.,]+$"
      />
      <InputGroupAddon align="inline-end">
        <span className="text-sm text-muted-foreground">{label}</span>
      </InputGroupAddon>
    </InputGroup>
  );
};
