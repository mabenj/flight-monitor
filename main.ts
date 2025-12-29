import { getFlights } from "./api.ts";
import { load } from "@std/dotenv";

async function main() {
  const bounds = Deno.env.get("BOUNDS");
  if (!bounds) {
    console.error("BOUNDS environment variable is not set.");
    return;
  }
  const flights = await getFlights(bounds);
  console.log(flights);
}

if (import.meta.main) {
  await load({ export: true });
  await main();
}
