import { Application, Router, RouterContext, Context } from "@oak/oak";
import { DatabaseSync } from "node:sqlite";
import { Database } from "./db/database.ts";
import { AppContext } from "./lib/context.ts";
import { TaskScheduler } from "./lib/scheduler.ts";
import {
  contextMiddleware,
  loggingMiddleware,
  corsMiddleware,
  staticFilesMiddleware,
} from "./lib/middleware.ts";
import { setupRoutes } from "./lib/routes.ts";
import { ApiError } from "./lib/errors.ts";
import Log from "./lib/log.ts";
import { MatrixClient } from "./rgb-matrix/matrix.ts";
import { config } from "./config.ts";

async function main() {
  await Log.setupLogging();
  const logger = new Log("main");

  const db = await Database.getDb();
  const appContext = AppContext.create(db);
  const scheduler = new TaskScheduler(appContext);
  setupShutdown(db, scheduler, logger);

  const app = new Application();
  const router = new Router();
  app.use(contextMiddleware(appContext));
  app.use(loggingMiddleware());
  app.use(corsMiddleware());
  app.use(errorHandlingMiddleware());
  app.use(staticFilesMiddleware());
  setupRoutes(router, appContext);
  app.use(router.routes());
  app.use(router.allowedMethods());

  scheduler.start();

  const PORT = config.server.port;
  logger.info(`Server is running on http://localhost:${PORT}`);
  await app.listen({ port: PORT });
}

function setupShutdown(
  db: DatabaseSync,
  scheduler: TaskScheduler,
  logger: Log
): void {
  Deno.addSignalListener("SIGINT", async () => {
    logger.info("Shutting down...");

    scheduler.stop();

    if (db.isOpen) {
      db.close();
    }

    await MatrixClient.getInstance().close();
    logger.info("Shutdown complete");

    Deno.exit(0);
  });
}

/**
 * Error handling middleware
 */
function errorHandlingMiddleware() {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    try {
      await next();
    } catch (error) {
      const logger = new Log("error-handler");

      if (error instanceof ApiError) {
        ctx.response.status = error.statusCode;
        ctx.response.body = error.body || { error: error.message };
        logger.warn(`API Error: ${error.message}`);
      } else if (error instanceof Error) {
        ctx.response.status = 500;
        ctx.response.body = { error: "Internal server error" };
        logger.error("Unhandled error", error);
      } else {
        ctx.response.status = 500;
        ctx.response.body = { error: "Internal server error" };
        logger.error("Unhandled error", error);
      }
    }
  };
}

if (import.meta.main) {
  await main();
}
