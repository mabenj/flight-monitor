import { BoundsService } from "../services/bounds-service.ts";
import { FlightsService } from "../services/flights-service.ts";
import { FlightRadar24ApiService } from "../services/flightradar24-api-service.ts";
import Log from "../lib/log.ts";
import { AppContext } from "../lib/context.ts";

export async function scrapeActiveFlights(
  ctx: AppContext,
  signal?: AbortSignal
) {
  const logger = new Log("scrape-flights");
  const boundsService = new BoundsService(ctx.db, ctx.events);
  const flightsService = new FlightsService(ctx.db);
  const apiService = new FlightRadar24ApiService();

  const bounds = boundsService.getActive();
  if (!bounds) {
    logger.info("No active bounds found");
    return;
  }

  const flights = await apiService.getFlightsByBounds(bounds, signal);

  const activeBoundsId = boundsService.getActive()?.id;
  if (activeBoundsId !== bounds.id) {
    logger.info(
      "Active bounds changed during flight retrieval, skipping update"
    );
    return;
  }
  flightsService.setActiveFlights(flights);
}
