import { Application, Router } from "@oak/oak";
import { Database } from "./db/database.ts";

async function main() {
  const db = await Database.getDb();
  Deno.addSignalListener("SIGINT", () => db.close());

  const app = new Application();
  const router = new Router();

  // API routes
  router.get("/api/bounds", (ctx) => {
    const bounds = db.prepare("SELECT * FROM bounds").all();
    ctx.response.body = { bounds };
  });
  router.post("/api/bounds", async (ctx) => {
    const { longitudeMax, longitudeMin, latitudeMax, latitudeMin, label } =
      await ctx.request.body.json();
    db.prepare(
      "INSERT INTO bounds (longitudeMax, longitudeMin, latitudeMax, latitudeMin, label) VALUES (?, ?, ?, ?, ?)"
    ).run(longitudeMax, longitudeMin, latitudeMax, latitudeMin, label);
    ctx.response.body = {
      longitudeMax,
      longitudeMin,
      latitudeMax,
      latitudeMin,
      label,
    };
  });

  // CORS
  app.use((ctx, next) => {
    ctx.response.headers.set(
      "Access-Control-Allow-Origin",
      "http://localhost:3000"
    );
    return next();
  });

  // Vite React static files
  app.use(async (context, next) => {
    try {
      await context.send({
        root: `${Deno.cwd()}/dist`,
        index: "index.html",
      });
    } catch {
      await next();
    }
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  const PORT = Number(Deno.env.get("PORT")) || 3001;
  console.log(`Server is running on http://localhost:${PORT}`);
  await app.listen({ port: PORT });
}

if (import.meta.main) {
  await main();
}
