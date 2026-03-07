import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function useBrightness() {
  const [brightness, setBrightness] = useState<number>(100);

  useEffect(() => {
    fetchBrightness()
      .then((data) => setBrightness(data.brightness))
      .catch((err) => {
        console.error("Failed to fetch brightness:", err);
      });
  }, []);

  const updateBrightness = async (value: number) => {
    const data = await toast
      .promise(
        async () => {
          const response = await fetch("/api/matrix/brightness", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brightness: value }),
          });
          if (!response.ok) {
            throw new Error("Failed to update brightness");
          }
          const data = await response.json();
          return data;
        },
        {
          loading: "Updating brightness...",
          success: "Brightness updated",
          error: "Failed to update brightness",
        }
      )
      .unwrap();
    setBrightness(data.brightness);
  };

  return {
    brightness,
    updateBrightness,
  };
}

async function fetchBrightness() {
  const response = await fetch("/api/matrix/brightness");
  if (!response.ok) {
    throw new Error("Failed to fetch brightness");
  }
  const data = await response.json();
  return data;
}
