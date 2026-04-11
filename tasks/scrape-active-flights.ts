import { AppContext } from "../lib/context.ts";
import { logger } from "../lib/log.ts";

const log = logger("scrape-active-flights");

export async function scrapeActiveFlights(
  ctx: AppContext,
  signal?: AbortSignal
) {
  const { boundsService, flightsService, fr24 } = ctx;

  const bounds = boundsService.getActive();
  if (!bounds) {
    return;
  }

  const flights = await fr24.getFlightsByBounds(bounds, signal);

  const activeBoundsId = boundsService.getActive()?.id;
  if (activeBoundsId !== bounds.id) {
    log.info("Active bounds changed during flight retrieval, skipping update");
    return;
  }
  flightsService.setActiveFlights(flights);
}
