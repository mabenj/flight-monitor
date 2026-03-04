import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export default function BrightnessControl() {
  const [brightness, setBrightness] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // Try to load current brightness from backend (optional)
    (async () => {
      try {
        const res = await fetch("/api/matrix/brightness", { method: "GET" });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data?.brightness === "number")
          setBrightness(clamp(data.brightness));
      } catch (e) {
        // ignore — backend may not exist yet
      }
    })();
  }, []);

  const handleSave = async () => {
    const value = clamp(brightness);
    setLoading(true);
    setStatus(null);
    try {
      await fetch("/api/matrix/brightness", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brightness: value }),
      });
      setStatus("Saved");
    } catch (e) {
      setStatus("Error");
    } finally {
      setLoading(false);
    }
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
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="h-2 w-48 appearance-none rounded-lg bg-slate-200"
          />
          <div className="w-20">
            <Input
              aria-label="brightness-number"
              type="number"
              value={brightness}
              min={0}
              max={100}
              onChange={(e) =>
                setBrightness(clamp(Number(e.target.value || 0)))
              }
            />
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setBrightness(50)}
          disabled={loading}
        >
          Reset
        </Button>
        <Button size="sm" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
        {status && (
          <span className="ml-2 text-sm text-slate-500">{status}</span>
        )}
      </div>
    </div>
  );
}
