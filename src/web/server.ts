import { Application, Router } from "@oak/oak";
import { getBounds, setBounds } from "../database/bounds.ts";

const app = new Application();
const router = new Router();

router.get("/api/bounds", async (ctx) => {
  const bounds = await getBounds();
  if (!bounds) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Bounds not set" };
    return;
  }
  ctx.response.body = { bounds };
});
router.post("/api/bounds", async (ctx) => {
  const { bounds } = await ctx.request.body.json();
  if (!Array.isArray(bounds) || bounds.length !== 4) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid bounds format" };
    return;
  }
  const [latMax, latMin, lonMax, lonMin] = Array.from(bounds).map(Number);
  if (latMax < latMin || lonMax < lonMin) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid bounds values" };
    return;
  }
  await setBounds(latMax, latMin, lonMax, lonMin);
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = Deno.env.get("PORT") || 8000;
console.log(`Server is running on port ${port}`);
await app.listen({ port: Number(port) });
