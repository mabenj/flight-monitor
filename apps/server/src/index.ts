import cron from "node-cron";
import express, { type Request, type Response } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === "development") {
  app.use(cors({ origin: "http://localhost:3000" }));
}
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public"))); // UI build

const db = new DatabaseSync("db.sqlite");
db.exec(`
  CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY, timestamp TEXT, message TEXT);
`);

// cron.schedule("*/30 * * * * *", () => {
//   console.log("30s task");
// });
// cron.schedule("* * * * * *", () => {
//   console.log("1s task");
// });

app.get("/api/config", (req: Request, res: Response) => {
  console.log("get config");
  res.send();
});
app.post("/api/config", (req: Request, res: Response) => {
  console.log("post config", req.body);
  res.send();
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));
