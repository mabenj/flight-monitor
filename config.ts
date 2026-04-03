/**
 * Application configuration and constants
 */

export const config = {
  server: {
    port: Number(Deno.env.get("PORT")) || 3001,
    corsOrigin: Deno.env.get("CORS_ORIGIN") || "http://localhost:3000",
    distDir: `${Deno.cwd()}/dist`,
  },

  database: {
    filename: "db.sqlite",
  },

  tasks: {
    scrapeInterval: 30_000, // 30 seconds
    matrixSendInterval:
      Number(Deno.env.get("MATRIX_SEND_INTERVAL")) || undefined,
  },

  flightradar24: {
    detailsUrl: "https://data-live.flightradar24.com/clickhandler/?flight=",
    realtimeUrl: "https://data-cloud.flightradar24.com/zones/fcgi/feed.js",
    airportUrl: "https://api.flightradar24.com/common/v1/airport.json",
    headers: {
      "accept-encoding": "gzip, br",
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      accept: "application/json",
      "cache-control": "max-age=0",
      origin: "https://www.flightradar24.com",
      referer: "https://www.flightradar24.com/",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
    },
    queryParams: {
      faa: 1,
      satellite: 1,
      mlat: 1,
      flarm: 1,
      adsb: 1,
      gnd: 1,
      air: 1,
      vehicles: 0,
      estimated: 1,
      maxage: 14400,
      gliders: 1,
      stats: 1,
      limit: 1500,
    },
    delayBetweenRequestsMs: 200,
  },

  matrix: {
    displayWidthPx: 64,
    displayHeightPx: 32,
    displayFontWidthPx: 5,
    displayFontHeightPx: 7,
    timing: {
      betweenScrollsMs: 2_000,
      betweenMetarAndPricesMs: 5_000,
      routeScrollFrameMs: 20,
      airlineScrollFrameMs: 20,
      aircraftScrollFrameMs: 20,
      metarScrollFrameMs: 40,
      priceScrollFrameMs: 50,
      scheduleScrollFrameMs: 20,
      speedAndHeadingScrollFrameMs: 20,
      startingUpFrameMs: 10,
    },
    colors: {
      white: { r: 255, g: 255, b: 255 },
      magenta: { r: 210, g: 50, b: 235 },
      cyan: { r: 50, g: 210, b: 235 },
      green: { r: 37, g: 242, b: 10 },
      orange: { r: 255, g: 165, b: 0 },
      grey: { r: 128, g: 128, b: 128 },
      red: { r: 255, g: 0, b: 0 },
      blue: { r: 0, g: 0, b: 255 },
      yellow: { r: 255, g: 255, b: 0 },
    },
    infoScrollEveryNFrames: 5,
  },

  validation: {
    bounds: {
      labelMinLength: 1,
      labelMaxLength: 50,
      longitudeMin: -180,
      longitudeMax: 180,
      latitudeMin: -90,
      latitudeMax: 90,
    },
    brightness: {
      min: 0,
      max: 100,
    },
  },

  logging: {
    level: "DEBUG",
    filename: `${Deno.cwd()}/logs/flight-tracker.log`,
    maxBytes: 10 * 1024 * 1024, // 10 MB per file
    maxBackupCount: 5,
  },

  electricity: {
    pricesUrl: "https://api.porssisahko.net/v1/latest-prices.json",
    pricesCacheTtlMs: 60 * 60 * 1000, // 1 hour
  },
} as const;
