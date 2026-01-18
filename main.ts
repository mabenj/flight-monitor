import { Application, Router } from "@oak/oak";
import { Database } from "./db/database.ts";
import { BoundsService } from "./services/bounds-service.ts";
import { FlightsService } from "./services/flights-service.ts";
import { DatabaseSync } from "node:sqlite";
import { scrapeActiveFlights } from "./tasks/scrape-active-flights.ts";
import { logFlights } from "./tasks/log-flights.ts";
import Log from "./lib/log.ts";

async function main() {
  const db = await Database.getDb();
  Deno.addSignalListener("SIGINT", () => db.close());

  const app = new Application();
  const router = new Router();

  // API routes
  router.get("/api/bounds", (ctx) => {
    const service = new BoundsService(db);
    ctx.response.body = service.getAll();
  });
  router.get("/api/bounds/:id", (ctx) => {
    const service = new BoundsService(db);
    ctx.response.body = service.get(Number(ctx.params.id));
    if (!ctx.response.body) {
      ctx.response.status = 404;
    }
  });
  router.post("/api/bounds", async (ctx) => {
    const body = await ctx.request.body.json();
    const service = new BoundsService(db);
    const [error, bounds] = service.create(body);
    if (error) {
      ctx.response.status = 400;
      ctx.response.body = error;
    } else {
      ctx.response.status = 201;
      ctx.response.body = bounds;
    }
  });
  router.put("/api/bounds/:id", async (ctx) => {
    const body = await ctx.request.body.json();
    const service = new BoundsService(db);
    const [error, bounds] = service.update(Number(ctx.params.id), body);
    if (error) {
      ctx.response.status = 400;
      ctx.response.body = error;
    } else {
      ctx.response.status = 201;
      ctx.response.body = bounds;
    }
  });
  router.get("/api/flights/active", (ctx) => {
    const service = new FlightsService(db);
    ctx.response.body = service.getActiveFlights();
  });

  // Log
  app.use((ctx, next) => {
    const logger = new Log("api");
    logger.info(`${ctx.request.method} ${ctx.request.url}`);
    return next();
  });

  // CORS
  app.use((ctx, next) => {
    ctx.response.headers.set(
      "Access-Control-Allow-Origin",
      "http://localhost:3000"
    );
    return next();
  });

  // Vite React static files
  app.use(async (context, next) => {
    try {
      await context.send({
        root: `${Deno.cwd()}/dist`,
        index: "index.html",
      });
    } catch {
      await next();
    }
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  startTasks(db);

  const PORT = Number(Deno.env.get("PORT")) || 3001;
  console.log(`Server is running on http://localhost:${PORT}`);
  await app.listen({ port: PORT });
}

function startTasks(db: DatabaseSync) {
  const SCRAPE_INTERVAL = 10_000;
  const LOG_INTERVAL = 1_000;

  setInterval(() => {
    scrapeActiveFlights(db).catch(console.error);
  }, SCRAPE_INTERVAL);

  setInterval(() => {
    logFlights(db);
  }, LOG_INTERVAL);
}

if (import.meta.main) {
  await main();
}
