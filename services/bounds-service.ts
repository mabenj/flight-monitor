import { DatabaseSync, SQLOutputValue } from "node:sqlite";
import { Bounds } from "../types/bounds.ts";
import { CreateResult } from "../types/create-result.ts";

export class BoundsService {
  constructor(private readonly db: DatabaseSync) {}

  delete(id: number): { reason: string } | null {
    const result = this.db.prepare("DELETE FROM bounds WHERE id = ?").run(id);
    if (result.changes === 0) {
      return { reason: "Bounds not found" };
    }
    return null;
  }

  getAll(): Bounds[] {
    const allBounds = this.db.prepare("SELECT * FROM bounds").all();
    return allBounds.map(this.mapToBounds);
  }

  get(id: number): Bounds | null {
    const bounds = this.db.prepare("SELECT * FROM bounds WHERE id = ?").get(id);
    if (!bounds) {
      return null;
    }
    return this.mapToBounds(bounds);
  }

  getActive(): Bounds | null {
    const bounds = this.db
      .prepare("SELECT * FROM bounds WHERE isActive = 1")
      .get();
    if (!bounds) {
      return null;
    }
    return this.mapToBounds(bounds);
  }

  create(bounds: Bounds): CreateResult<Bounds> {
    const badRequest = this.validate(bounds);
    if (badRequest) {
      return [badRequest, null];
    }
    try {
      this.db.exec("BEGIN TRANSACTION;");
      const id = this.db
        .prepare(
          "INSERT INTO bounds (longitudeMax, longitudeMin, latitudeMax, latitudeMin, label, isActive) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .run(
          bounds.longitudeMax,
          bounds.longitudeMin,
          bounds.latitudeMax,
          bounds.latitudeMin,
          bounds.label,
          bounds.isActive ? 1 : 0
        ).lastInsertRowid;
      if (bounds.isActive) {
        this.db.prepare("UPDATE bounds SET isActive = 0 WHERE id != ?").run(id);
      }
      this.db.exec("COMMIT;");
      return [null, this.get(Number(id))!];
    } catch (error) {
      this.db.exec("ROLLBACK;");
      throw error;
    }
  }

  update(id: number, bounds: Bounds): CreateResult<Bounds> {
    const badRequest = this.validate(bounds);
    if (badRequest) {
      return [badRequest, null];
    }
    try {
      this.db.exec("BEGIN TRANSACTION;");
      this.db
        .prepare(
          "UPDATE bounds SET longitudeMax = ?, longitudeMin = ?, latitudeMax = ?, latitudeMin = ?, label = ?, isActive = ? WHERE id = ?"
        )
        .run(
          bounds.longitudeMax,
          bounds.longitudeMin,
          bounds.latitudeMax,
          bounds.latitudeMin,
          bounds.label,
          bounds.isActive ? 1 : 0,
          id
        );
      if (bounds.isActive) {
        this.db.prepare("UPDATE bounds SET isActive = 0 WHERE id != ?").run(id);
      }
      this.db.exec("COMMIT;");
      return [null, this.get(id)!];
    } catch (error) {
      this.db.exec("ROLLBACK;");
      throw error;
    }
  }

  private validate(bounds: Bounds): {
    reason: string;
  } | null {
    if (bounds.longitudeMax < bounds.longitudeMin) {
      return { reason: "Longitude max must be greater than longitude min" };
    }
    if (bounds.latitudeMax < bounds.latitudeMin) {
      return { reason: "Latitude max must be greater than latitude min" };
    }
    if (bounds.longitudeMax > 180 || bounds.longitudeMin < -180) {
      return { reason: "Longitude must be between -180 and 180" };
    }
    if (bounds.latitudeMax > 90 || bounds.latitudeMin < -90) {
      return { reason: "Latitude must be between -90 and 90" };
    }
    if (bounds.label.length > 50 || bounds.label.length < 1) {
      return { reason: "Label must be between 1 and 50 characters" };
    }
    const duplicateLabel = this.db
      .prepare("SELECT label FROM bounds WHERE label = ? AND id != ?")
      .get(bounds.label, bounds.id);
    if (duplicateLabel) {
      return { reason: "Label must be unique" };
    }
    return null;
  }

  private mapToBounds(row: Record<string, SQLOutputValue>): Bounds {
    return {
      id: row.id as number,
      longitudeMax: row.longitudeMax as number,
      longitudeMin: row.longitudeMin as number,
      latitudeMax: row.latitudeMax as number,
      latitudeMin: row.latitudeMin as number,
      label: row.label as string,
      isActive: row.isActive === 1,
    };
  }
}
