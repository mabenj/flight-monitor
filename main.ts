import { load } from "@std/dotenv";
import { logFlights } from "./src/lib/flight-console-logger.ts";
import { getBounds } from "./src/database/bounds.ts";
import { delay } from "./src/utils.ts";
import { getFlights } from "./src/fr24-api.ts";

async function main() {
  while (true) {
    const bounds = await getBounds();
    if (!bounds) {
      console.error("Bounds not set in the database. Exiting.");
      Deno.exit(1);
    }
    const flights = await getFlights(bounds.join(","));
    logFlights(flights);
    await delay(30000);
  }
}

if (import.meta.main) {
  await load({ export: true });
  await main();
}
