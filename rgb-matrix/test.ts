import { MatrixClient } from "./matrix.ts";

const client = MatrixClient.getInstance();

async function test() {
  await client.brightness(0.1);
  await client.clear();
  await client.text("Hello, world!");
}

await test();
await client.close();
