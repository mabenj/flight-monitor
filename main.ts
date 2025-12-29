import { getFlights } from "./api.ts";
import { load } from "@std/dotenv";
import { logFlights } from "./flight-console-logger.ts";

async function main() {
  const bounds = Deno.env.get("BOUNDS");
  if (!bounds) {
    console.error("BOUNDS environment variable is not set.");
    return;
  }
  while (true) {
    const flights = await getFlights(bounds);
    logFlights(flights);
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
}

if (import.meta.main) {
  await load({ export: true });
  await main();
}
