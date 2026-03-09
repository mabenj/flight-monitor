import { DatabaseSync } from "node:sqlite";
import { formatAltitude, sleep } from "../lib/utils.ts";
import { Flight } from "../types/flight.ts";
import { MatrixClient, type TextCmd } from "../rgb-matrix/matrix.ts";
import { FlightsService } from "../services/flights-service.ts";
import { SettingsService } from "../services/settings-service.ts";
import { config } from "../config.ts";
import { WeatherService } from "../services/weather-service.ts";
import { BoundsService } from "../services/bounds-service.ts";
import { Weather } from "../types/weather.ts";

type FlightTextCmds = ReturnType<typeof flightToTextCmds>;
interface DisplayContext {
  matrix: MatrixClient;
  flightService: FlightsService;
  settingsService: SettingsService;
  weatherService: WeatherService;
  boundsService: BoundsService;
}

let ctx: DisplayContext | null = null;
/**
 * How many times sendFlightsToMatrix has been called. Used to decide whether
 * to scroll the METAR or just show the static weather screen.
 */
let callCount = 0;

const METAR_SCROLL_EVERY_N_CALLS = 5;

function getContext(db: DatabaseSync): DisplayContext {
  if (!ctx) {
    ctx = {
      matrix: MatrixClient.getInstance(),
      flightService: new FlightsService(db),
      settingsService: new SettingsService(db),
      weatherService: new WeatherService(db),
      boundsService: new BoundsService(db),
    };
  }
  return ctx;
}

export async function updateMatrixDisplay(db: DatabaseSync): Promise<void> {
  const {
    matrix,
    flightService,
    settingsService,
    weatherService,
    boundsService,
  } = getContext(db);

  callCount++;

  let brightness = settingsService.getBrightness();
  await matrix.brightness(brightness);

  const bounds = boundsService.getActive();
  const weather: Weather | null = bounds?.airportCode
    ? weatherService.getWeather(bounds.airportCode)
    : null;

  let flights = flightService.getActiveFlights();

  if (flights.length === 0) {
    const shouldScrollMetar = callCount % METAR_SCROLL_EVERY_N_CALLS === 0;
    await showWeather(matrix, weather, shouldScrollMetar);
    return;
  }

  for (let i = 0; i < flights.length; i++) {
    flights = flightService.getActiveFlights();
    if (i >= flights.length) {
      break;
    }
    brightness = settingsService.getBrightness();
    await matrix.brightness(brightness);
    await showFlight(matrix, flights[i], i + 1, flights.length);
  }
}

async function showWeather(
  matrix: MatrixClient,
  weather: Weather | null,
  scrollMetar: boolean
): Promise<void> {
  const now = new Date();

  const timeString = formatTime(now);
  const dateString = formatDate(now);
  const tempC = `${weather?.tempCelsius ?? "--"}°C`;

  const timeCmd: TextCmd = {
    cmd: "text",
    text: timeString,
    y: 8,
    x: 2,
    ...config.matrix.colors.magenta,
  };
  const tempCmd: TextCmd = {
    cmd: "text",
    text: tempC,
    y: 8,
    x: 62 - tempC.length * config.matrix.displayFontWidthPx,
    ...config.matrix.colors.white,
  };
  const dateCmd: TextCmd = {
    cmd: "text",
    text: dateString,
    y: 15,
    x: 2,
    ...config.matrix.colors.cyan,
  };

  const staticCmds = [timeCmd, tempCmd, dateCmd];

  if (scrollMetar && weather?.metar) {
    const metarCmd: TextCmd = {
      cmd: "text",
      text: weather.metar,
      y: 29,
      x: 2,
      ...config.matrix.colors.grey,
    };
    await scrollLeft(
      matrix,
      metarCmd,
      staticCmds,
      config.matrix.timing.metarScrollFrameMs
    );
  } else {
    await hold(matrix, staticCmds, config.matrix.timing.holdMs);
  }
}

async function showFlight(
  matrix: MatrixClient,
  flight: Flight,
  index: number,
  total: number
): Promise<void> {
  const cmds = flightToTextCmds(flight, index, total);
  const aircraftForStatic = chooseAircraftLine(cmds);

  const staticFrame: TextCmd[] = [
    cmds.flightCount,
    cmds.routeShort,
    cmds.flightNumber,
    aircraftForStatic,
    cmds.altitude,
  ];

  await hold(matrix, staticFrame, config.matrix.timing.holdMs);
  await sleep(config.matrix.timing.betweenScrollsMs);

  await scrollLeft(
    matrix,
    cmds.routeLong,
    [cmds.flightNumber, aircraftForStatic, cmds.altitude],
    config.matrix.timing.routeScrollFrameMs
  );

  await scrollLeft(
    matrix,
    cmds.airlineAndCallsign,
    [cmds.flightCount, cmds.routeShort, aircraftForStatic, cmds.altitude],
    config.matrix.timing.airlineScrollFrameMs
  );

  if (needsScroll(cmds.aircraftLong)) {
    await scrollLeft(
      matrix,
      cmds.aircraftLong,
      [cmds.flightCount, cmds.routeShort, cmds.flightNumber, cmds.altitude],
      config.matrix.timing.aircraftScrollFrameMs
    );
  }

  await hold(matrix, staticFrame, config.matrix.timing.holdMs);
  await sleep(config.matrix.timing.betweenScrollsMs);
}

async function renderFrame(
  matrix: MatrixClient,
  cmds: TextCmd[]
): Promise<void> {
  await matrix.clear();
  for (const cmd of cmds) await matrix.send(cmd);
  await matrix.flush();
}

async function hold(
  matrix: MatrixClient,
  cmds: TextCmd[],
  ms: number
): Promise<void> {
  await renderFrame(matrix, cmds);
  await sleep(ms);
}

async function scrollLeft(
  matrix: MatrixClient,
  scrollingCmd: TextCmd,
  fixedCmds: TextCmd[],
  frameDelayMs: number
): Promise<void> {
  let x = startOffscreenRight(scrollingCmd);
  const w = textWidthPx(scrollingCmd.text);

  while (x + w >= 0) {
    await renderFrame(matrix, [...fixedCmds, { ...scrollingCmd, x }]);
    await sleep(frameDelayMs);
    x -= 1;
  }
}

function textWidthPx(text: string): number {
  return text.length * config.matrix.displayFontWidthPx;
}

function needsScroll(cmd: TextCmd): boolean {
  return textWidthPx(cmd.text) > config.matrix.displayWidthPx - 4;
}

function startOffscreenRight(cmd: TextCmd): number {
  const baseX = cmd.x ?? 2;
  return baseX + (config.matrix.displayWidthPx - 2);
}

function chooseAircraftLine(cmds: FlightTextCmds): TextCmd {
  return needsScroll(cmds.aircraftLong)
    ? cmds.aircraftShort
    : cmds.aircraftLong;
}

function formatTime(date: Date): string {
  return [
    date.getHours().toString().padStart(2, "0"),
    date.getMinutes().toString().padStart(2, "0"),
  ].join(":");
}

function formatDate(date: Date): string {
  const longDate = date.toLocaleDateString("fi-FI", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  if (
    longDate.length * config.matrix.displayFontWidthPx <
    config.matrix.displayWidthPx - 4
  ) {
    return longDate;
  }
  const shortDate = date.toLocaleDateString("fi-FI", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "2-digit",
  });
  return shortDate;
}

function flightToTextCmds(flight: Flight, index = 1, total = 1) {
  const countText = total > 1 ? `${index}/${total}` : "";

  const flightCount: TextCmd = {
    cmd: "text",
    text: countText,
    y: 8,
    x:
      total > 1 ? 62 - countText.length * config.matrix.displayFontWidthPx : 64,
    ...config.matrix.colors.white,
  };

  const routeShort: TextCmd = {
    cmd: "text",
    text: `${flight.origin?.iata ?? "N/A"}-${
      flight.destination?.iata ?? "N/A"
    }`,
    y: 8,
    x: 2,
    ...config.matrix.colors.magenta,
  };

  const routeLong: TextCmd = {
    cmd: "text",
    text: `${normalizeAirportName(
      flight.origin?.name
    )} - ${normalizeAirportName(flight.destination?.name)}`,
    y: 8,
    x: 2,
    ...config.matrix.colors.magenta,
  };

  const flightNumber: TextCmd = {
    cmd: "text",
    text: flight.flightNumber ?? flight.callsign ?? "N/A",
    y: 15,
    x: 2,
    ...config.matrix.colors.white,
  };

  const airlineAndCallsign: TextCmd = {
    cmd: "text",
    text: `${flight.airline?.name ?? "N/A"} ${flight.callsign ?? "N/A"}`,
    y: 15,
    x: 2,
    ...config.matrix.colors.white,
  };

  const aircraftShort: TextCmd = {
    cmd: "text",
    text: flight.aircraft?.modelCode ?? flight.aircraft?.registration ?? "N/A",
    y: 22,
    x: 2,
    ...config.matrix.colors.cyan,
  };

  const aircraftLong: TextCmd = {
    cmd: "text",
    text:
      flight.aircraft?.modelText ??
      flight.aircraft?.modelCode ??
      flight.aircraft?.registration ??
      "N/A",
    y: 22,
    x: 2,
    ...config.matrix.colors.cyan,
  };

  const altitude: TextCmd = {
    cmd: "text",
    text: flight.altitude > 0 ? formatAltitude(flight.altitude) : "ON GROUND",
    y: 29,
    x: 2,
    ...config.matrix.colors.green,
  };

  return {
    flightCount,
    routeShort,
    routeLong,
    flightNumber,
    airlineAndCallsign,
    aircraftShort,
    aircraftLong,
    altitude,
  };
}

function normalizeAirportName(name: string | undefined | null): string {
  return name?.replace("International Airport", "Intl.") ?? "N/A";
}
