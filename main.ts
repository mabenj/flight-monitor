import { Application, Router } from "@oak/oak";
import { Database } from "./db/database.ts";
import { BoundsService } from "./services/bounds-service.ts";
import { FlightsService } from "./services/flights-service.ts";
import { SettingsService } from "./services/settings-service.ts";
import { DatabaseSync } from "node:sqlite";
import { scrapeActiveFlights } from "./tasks/scrape-active-flights.ts";
import Log from "./lib/log.ts";
import { MatrixClient } from "./rgb-matrix/matrix.ts";
// import { sendFlightsToMatrix } from "./tasks/send-flights-to-matrix.ts";

let running = false;

async function main() {
  const logger = new Log("main");

  const db = await Database.getDb();
  Deno.addSignalListener("SIGINT", async () => {
    logger.info("Shutting down...");
    running = false;
    db.isOpen && db.close();
    await MatrixClient.getInstance().close();
    Deno.exit();
  });

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
  router.delete("/api/bounds/:id", (ctx) => {
    const service = new BoundsService(db);
    const error = service.delete(Number(ctx.params.id));
    if (error) {
      ctx.response.status = 400;
      ctx.response.body = error;
    } else {
      ctx.response.status = 204;
    }
  });

  router.get("/api/flights/active", (ctx) => {
    const service = new FlightsService(db);
    ctx.response.body = service.getActiveFlights();
  });

  router.get("/api/matrix/brightness", (ctx) => {
    const service = new SettingsService(db);
    ctx.response.body = { brightness: service.getBrightness() };
  });

  router.put("/api/matrix/brightness", async (ctx) => {
    const body = await ctx.request.body.json();
    const brightness = body.brightness;
    if (typeof brightness !== "number" || brightness < 0 || brightness > 100) {
      ctx.response.status = 400;
      ctx.response.body = {
        reason: "Brightness must be a number between 0 and 100",
      };
      return;
    }
    const service = new SettingsService(db);
    service.setBrightness(brightness);
    ctx.response.status = 200;
    ctx.response.body = { brightness };
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

  running = true;
  startTasks(db);

  const PORT = Number(Deno.env.get("PORT")) || 3001;
  logger.info(`Server is running on http://localhost:${PORT}`);
  await app.listen({ port: PORT });
}

function startTasks(db: DatabaseSync) {
  const SCRAPE_INTERVAL = 30_000;
  const scrapeIntervalId = setInterval(async () => {
    await scrapeActiveFlights(db).catch(console.error);
    if (!running) {
      clearInterval(scrapeIntervalId);
    }
  }, SCRAPE_INTERVAL);

  //   const callSendFlightsToMatrix = async () => {
  //     if (!running) {
  //       return;
  //     }
  //     await sendFlightsToMatrix(db).catch(console.error);
  //     setTimeout(callSendFlightsToMatrix);
  //   };
  //   callSendFlightsToMatrix();
}

if (import.meta.main) {
  await main();
}
