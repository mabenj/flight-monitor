import { useEffect, useState } from "react";
import type { Bounds } from "@/types/bounds.ts";
import { toast } from "sonner";

export default function useBounds() {
  const [bounds, setBounds] = useState<Bounds[] | null>(null);

  useEffect(() => {
    fetchBounds()
      .then((data) => setBounds(data))
      .catch((err) => {
        toast.error((err as Error).message);
        console.error(err);
      });
  }, []);

  const createBounds = async (newBounds: Bounds) => {
    const data = await toast
      .promise(
        async () => {
          const response = await fetch(`/api/bounds`, {
            method: "POST",
            body: JSON.stringify(newBounds),
          });
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          const data = await response.json();
          return data as Bounds;
        },
        {
          loading: "Creating bounding box...",
          success: "Bounding box created",
          error: "Failed to create bounding box",
        }
      )
      .unwrap();
    setBounds((prev) => [...(prev ?? []), data]);
    return data;
  };

  const updateBounds = async (updatedBounds: Bounds) => {
    const data = await toast
      .promise(
        async () => {
          const response = await fetch(`/api/bounds/${updatedBounds.id}`, {
            method: "PUT",
            body: JSON.stringify(updatedBounds),
          });
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          const data = await response.json();
          return data as Bounds;
        },
        {
          loading: "Updating bounding box...",
          success: "Bounding box updated",
          error: "Failed to update bounding box",
        }
      )
      .unwrap();
    setBounds(
      (prev) => prev?.map((b) => (b.id === data.id ? data : b)) ?? null
    );
    return data;
  };

  const deleteBounds = async (id: number) => {
    const { success } = await toast
      .promise(
        async () => {
          const response = await fetch(`/api/bounds/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          return { success: true };
        },
        {
          loading: "Deleting bounding box...",
          success: "Bounding box deleted",
          error: "Failed to delete bounding box",
        }
      )
      .unwrap();
    if (!success) {
      return;
    }
    setBounds((prev) => prev?.filter((b) => b.id !== id) ?? []);
  };

  return {
    bounds,
    createBounds,
    updateBounds,
    deleteBounds,
  };
}

async function fetchBounds() {
  const response = await fetch("/api/bounds");
  const data = await response.json();
  return data as Bounds[];
}
