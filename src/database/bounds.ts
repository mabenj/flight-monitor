import { getDb } from "./db.ts";

export async function setBounds(
  latMax: number,
  latMin: number,
  lonMax: number,
  lonMin: number
) {
  const db = await getDb();
  const stmt = db.prepare(
    "INSERT INTO bounds (lat_max, lat_min, lon_max, lon_min) VALUES (?, ?, ?, ?)"
  );
  stmt.run(latMax, latMin, lonMax, lonMin);
}

export async function getBounds(): Promise<
  [latMax: number, latMin: number, lonMax: number, lonMin: number] | null
> {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM bounds ORDER BY id DESC LIMIT 1");
  const row = stmt.get();
  if (!row?.lat_max || !row?.lat_min || !row?.lon_max || !row?.lon_min) {
    return null;
  }
  return [
    Number(row.lat_max),
    Number(row.lat_min),
    Number(row.lon_max),
    Number(row.lon_min),
  ];
}
