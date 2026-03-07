/**
 * Route middleware utilities
 */

import { Middleware, Context } from "@oak/oak";
import { AppContext } from "./context.ts";
import { config } from "../config.ts";
import Log from "./log.ts";

/**
 * Inject context into router state
 */
export function contextMiddleware(ctx: AppContext): Middleware {
  return async (routerCtx: Context, next: () => Promise<unknown>) => {
    routerCtx.state.context = ctx;
    await next();
  };
}

/**
 * Request logging middleware
 */
export function loggingMiddleware(): Middleware {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    const logger = new Log("api");
    logger.info(`${ctx.request.method} ${ctx.request.url}`);
    await next();
  };
}

/**
 * CORS middleware
 */
export function corsMiddleware(): Middleware {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    ctx.response.headers.set(
      "Access-Control-Allow-Origin",
      config.server.corsOrigin
    );
    ctx.response.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    if (ctx.request.method === "OPTIONS") {
      ctx.response.status = 204;
      return;
    }

    await next();
  };
}

/**
 * Static file serving middleware for SPA
 */
export function staticFilesMiddleware(): Middleware {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    try {
      await ctx.send({
        root: config.server.distDir,
        index: "index.html",
      });
    } catch {
      await next();
    }
  };
}
