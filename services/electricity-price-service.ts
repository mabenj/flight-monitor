import { config } from "../config.ts";
import Log from "../lib/log.ts";
import { ElectricityPrice } from "../types/electricity-price.ts";

const cache = {
  prices: [] as ElectricityPrice[],
  lastUpdate: 0,
};

export class ElectricityPriceService {
  private readonly logger = new Log("electricity-prices");

  async getElectricityPrice(): Promise<ElectricityPrice[]> {
    const now = Date.now();
    if (
      now - cache.lastUpdate < config.electricity.pricesCacheTtlMs &&
      cache.prices.length
    ) {
      return cache.prices;
    }
    try {
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
      this.logger.error(`Failed to fetch electricity prices: ${err}`);
    }
    return cache.prices;
  }

  async getCurrentAndUpcomingPrices(count = 4): Promise<ElectricityPrice[]> {
    const prices = await this.getElectricityPrice();
    const now = Math.floor(Date.now() / 1000);
    const relevantPrices = prices.filter((price) => price.startDate >= now);
    return relevantPrices.slice(0, count);
  }
}
