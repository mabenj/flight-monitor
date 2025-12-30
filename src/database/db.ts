import { DatabaseSync } from "node:sqlite";

let db: DatabaseSync | null = null;

export async function getDb() {
  if (!db) {
    await Deno.mkdir("./data", { recursive: true });
    db = new DatabaseSync("./data/app.db");
    db.exec(`
  CREATE TABLE IF NOT EXISTS bounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lon_max REAL,
    lon_min REAL,
    lat_max REAL,
    lat_min REAL
  );
`);
  }
  return db;
}
