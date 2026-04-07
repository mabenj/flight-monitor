import Log from "../lib/log.ts";
import { AppContext } from "../lib/context.ts";

export async function scrapeActiveFlights(
  ctx: AppContext,
  signal?: AbortSignal
) {
  const logger = new Log("scrape-flights");
  const { boundsService, flightsService, fr24 } = ctx;

  const bounds = boundsService.getActive();
  if (!bounds) {
    logger.info("No active bounds found");
    return;
  }

  const flights = await fr24.getFlightsByBounds(bounds, signal);

  const activeBoundsId = boundsService.getActive()?.id;
  if (activeBoundsId !== bounds.id) {
    logger.info(
      "Active bounds changed during flight retrieval, skipping update"
    );
    return;
  }
  flightsService.setActiveFlights(flights);
}
