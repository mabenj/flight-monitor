import cron from "node-cron";
import express, { type Request, type Response } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";
import { Database } from "./db/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === "development") {
  app.use(cors({ origin: "http://localhost:3000" }));
}
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public"))); // UI build

const db = await Database.getDb();

// cron.schedule("*/30 * * * * *", () => {
//   console.log("30s task");
// });
// cron.schedule("* * * * * *", () => {
//   console.log("1s task");
// });

app.get("/api/config", (req: Request, res: Response) => {
  console.log("get config");
  res.json({ foo: "bar" });
});
app.post("/api/config", (req: Request, res: Response) => {
  console.log("post config", req.body);
  res.send();
});

process.on("SIGTERM", () => db.close());
app.listen(PORT, () => console.log(`Server on ${PORT}`));
