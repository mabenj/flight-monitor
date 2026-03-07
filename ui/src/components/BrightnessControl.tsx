import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import useBrightness from "@/hooks/useBrightness.ts";
import { useState, useEffect } from "react";

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export default function BrightnessControl() {
  const { brightness, updateBrightness } = useBrightness();
  const [inputValue, setInputValue] = useState(brightness);

  useEffect(() => {
    setInputValue(brightness);
  }, [brightness]);

  const handleSave = async () => {
    const value = clamp(inputValue);
    await updateBrightness(value);
  };

  return (
    <div className="flex w-full items-center gap-4 px-4 py-3">
      <div className="flex items-center gap-3">
        <Label className="text-sm">Matrix brightness</Label>
        <div className="flex items-center gap-2">
          <input
            aria-label="brightness-range"
            type="range"
            min={0}
            max={100}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.valueAsNumber)}
            className="h-2 w-48 appearance-none rounded-lg bg-slate-200"
          />
          <div className="w-20">
            <Input
              aria-label="brightness-number"
              type="number"
              value={inputValue}
              min={0}
              max={100}
              onChange={(e) => setInputValue(e.target.valueAsNumber)}
            />
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setInputValue(brightness)}
        >
          Reset
        </Button>
        <Button size="sm" onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}
