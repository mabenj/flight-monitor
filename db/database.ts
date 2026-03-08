import { DatabaseSync } from "node:sqlite";
import * as path from "@std/path";
import { config } from "../config.ts";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "./migrations");

export class Database {
  public db: DatabaseSync;

  private constructor() {
    this.db = new DatabaseSync(config.database.filename);
  }

  public static async getDb() {
    const database = new Database();
    await database.migrate();
    return database.db;
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
    const targetVersion = 5; // Bump when adding migrations

    if (currentVersion === targetVersion) {
      return;
    }

    try {
      this.db.exec("BEGIN TRANSACTION;");

      const files: string[] = [];
      for await (const file of Deno.readDir(MIGRATIONS_DIR)) {
        if (file.name.endsWith(".sql")) {
          files.push(file.name);
        }
      }

      for (const file of files.sort()) {
        const version = file.split(".sql")[0]?.split("-")?.at(-1);
        if (version == null) {
          continue;
        }
        if (currentVersion >= version) {
          continue;
        }
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = await Deno.readTextFile(filePath);
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
