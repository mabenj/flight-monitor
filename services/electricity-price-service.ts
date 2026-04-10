import { config } from "../config.ts";
import { logger } from "../lib/log.ts";
import { ElectricityPrice } from "../types/electricity-price.ts";

const cache = {
  prices: [] as ElectricityPrice[],
  lastUpdate: 0,
};

export class ElectricityPriceService {
  private readonly log = logger(ElectricityPriceService.name);

  async getElectricityPrice(): Promise<ElectricityPrice[]> {
    const now = Date.now();
    if (
      now - cache.lastUpdate < config.electricity.pricesCacheTtlMs &&
      cache.prices.length
    ) {
      return cache.prices;
    }
    try {
      this.log.debug("Fetching electricity prices");
      const res = await fetch(config.electricity.pricesUrl);
      if (!res.ok) {
        throw new Error(`API request failed: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      const prices =
        // deno-lint-ignore no-explicit-any
        (data["prices"] as any[])
          ?.map(
            (price) =>
              ({
                startDate: Math.floor(
                  new Date(price["startDate"]).getTime() / 1000
                ),
                price: price["price"],
              } as ElectricityPrice)
          )
          .sort((a, b) => a.startDate - b.startDate) || [];
      cache.prices = prices;
      cache.lastUpdate = now;
    } catch (err) {
      this.log.error(
        `Failed to fetch electricity prices`,
        err instanceof Error ? err : new Error(String(err))
      );
    }
    return cache.prices;
  }

  async getCurrentAndUpcomingPrices(count = 8): Promise<ElectricityPrice[]> {
    const prices = await this.getElectricityPrice();
    const cutoff = Math.floor(new Date().setMinutes(0, 0, 0) / 1000);
    const relevantPrices = prices.filter((price) => price.startDate >= cutoff);
    return relevantPrices.slice(0, count);
  }
}
