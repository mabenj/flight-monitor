import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "./migrations");

export class Database {
  public db: DatabaseSync;

  private constructor() {
    this.db = new DatabaseSync("db.sqlite");
  }

  public static async getDb() {
    const db = new Database();
    await db.migrate();
    return db;
  }

  public close() {
    this.db.close();
  }

  private async migrate() {
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS dbVersion (id INTEGER PRIMARY KEY, version INTEGER);
      INSERT OR IGNORE INTO dbVersion (id, version) VALUES (1, 0);`
    );
    const currentVersion =
      this.db.prepare("SELECT version FROM dbVersion WHERE id = 1").get()
        ?.version || 0;
    const targetVersion = 1; // Bump when adding migrations

    if (currentVersion === targetVersion) {
      return;
    }

    try {
      this.db.exec("BEGIN TRANSACTION;");

      const files = await fs.readdir(MIGRATIONS_DIR);
      for (const file of files.filter((file) => file.endsWith(".sql")).sort()) {
        const version = file.split(".sql")[0]?.split("-")[1];
        if (version == null) {
          continue;
        }
        if (currentVersion >= version) {
          continue;
        }
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = await fs.readFile(filePath, "utf-8");
        this.db.exec(sql);
      }
      this.db.exec(
        `UPDATE dbVersion SET version = ${targetVersion} WHERE id = 1;`
      );
      this.db.exec("COMMIT TRANSACTION;");
    } catch (error) {
      this.db.exec("ROLLBACK TRANSACTION;");
      throw error;
    }
  }
}
