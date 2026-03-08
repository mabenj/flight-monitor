/**
 * API route definitions
 */

import { Router, RouterContext } from "@oak/oak";
import { AppContext } from "./context.ts";
import { config } from "../config.ts";
import { ApiError, ValidationApiError, NotFoundError } from "./errors.ts";
import { Bounds } from "../types/bounds.ts";

export function setupRoutes(router: Router, ctx: AppContext): void {
  // Bounds API
  router.get("/api/bounds", handleGetBounds);
  router.get("/api/bounds/:id", handleGetBoundById);
  router.post("/api/bounds", handleCreateBound);
  router.put("/api/bounds/:id", handleUpdateBound);
  router.delete("/api/bounds/:id", handleDeleteBound);

  // Flights API
  router.get("/api/flights/active", handleGetActiveFlights);

  // Matrix API
  router.get("/api/matrix/brightness", handleGetBrightness);
  router.put("/api/matrix/brightness", handleSetBrightness);

  // Weather API
  router.get("/api/weather:icao", handleGetWeather);
}

// ============ Bounds Handlers ============

async function handleGetBounds(routerCtx: RouterContext<"/api/bounds">) {
  const ctx = routerCtx.state.context as AppContext;
  const bounds = ctx.boundsService.getAll();
  routerCtx.response.body = bounds;
}

async function handleGetBoundById(routerCtx: RouterContext<"/api/bounds/:id">) {
  const ctx = routerCtx.state.context as AppContext;
  const id = Number(routerCtx.params.id);

  const bounds = ctx.boundsService.get(id);
  if (!bounds) {
    throw new NotFoundError(`Bounds with id ${id} not found`);
  }

  routerCtx.response.body = bounds;
}

async function handleCreateBound(routerCtx: RouterContext<"/api/bounds">) {
  const ctx = routerCtx.state.context as AppContext;
  const body = (await routerCtx.request.body.json()) as Bounds;

  const [error, bounds] = ctx.boundsService.create(body);
  if (error) {
    throw new ValidationApiError("Invalid bounds data", error.reason);
  }

  routerCtx.response.status = 201;
  routerCtx.response.body = bounds;
}

async function handleUpdateBound(routerCtx: RouterContext<"/api/bounds/:id">) {
  const ctx = routerCtx.state.context as AppContext;
  const id = Number(routerCtx.params.id);
  const body = (await routerCtx.request.body.json()) as Bounds;

  const [error, bounds] = ctx.boundsService.update(id, body);
  if (error) {
    throw new ValidationApiError("Invalid bounds data", error.reason);
  }

  routerCtx.response.status = 200;
  routerCtx.response.body = bounds;
}

async function handleDeleteBound(routerCtx: RouterContext<"/api/bounds/:id">) {
  const ctx = routerCtx.state.context as AppContext;
  const id = Number(routerCtx.params.id);

  const error = ctx.boundsService.delete(id);
  if (error) {
    throw new ValidationApiError("Failed to delete bounds", error.reason);
  }

  routerCtx.response.status = 204;
}

// ============ Flights Handlers ============

async function handleGetActiveFlights(
  routerCtx: RouterContext<"/api/flights/active">
) {
  const ctx = routerCtx.state.context as AppContext;
  const flights = ctx.flightsService.getActiveFlights();
  routerCtx.response.body = flights;
}

// ============ Matrix Handlers ============

async function handleGetBrightness(
  routerCtx: RouterContext<"/api/matrix/brightness">
) {
  const ctx = routerCtx.state.context as AppContext;
  const brightness = ctx.settingsService.getBrightness();
  routerCtx.response.body = { brightness };
}

async function handleSetBrightness(
  routerCtx: RouterContext<"/api/matrix/brightness">
) {
  const ctx = routerCtx.state.context as AppContext;
  const body = (await routerCtx.request.body.json()) as {
    brightness?: unknown;
  };

  const brightness = body.brightness;
  if (
    typeof brightness !== "number" ||
    brightness < config.validation.brightness.min ||
    brightness > config.validation.brightness.max
  ) {
    throw new ValidationApiError(
      "Invalid brightness value",
      `Brightness must be a number between ${config.validation.brightness.min} and ${config.validation.brightness.max}`
    );
  }

  ctx.settingsService.setBrightness(brightness);
  routerCtx.response.status = 200;
  routerCtx.response.body = { brightness };
}

async function handleGetWeather(routerCtx: RouterContext<"/api/weather:icao">) {
  const ctx = routerCtx.state.context as AppContext;
  const icao = routerCtx.params.icao;
  const weather = ctx.weatherService.getWeather(icao);
  routerCtx.response.body = weather;
}
