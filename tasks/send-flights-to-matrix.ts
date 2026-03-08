import { DatabaseSync } from "node:sqlite";
import { formatAltitude, sleep } from "../lib/utils.ts";
import { Flight } from "../types/flight.ts";
import { MatrixClient, type TextCmd } from "../rgb-matrix/matrix.ts";
import { FlightsService } from "../services/flights-service.ts";
import { SettingsService } from "../services/settings-service.ts";
import { config } from "../config.ts";

let matrix: MatrixClient;

type FlightTextCmds = ReturnType<typeof flightToTextCmds>;

export async function sendFlightsToMatrix(db: DatabaseSync) {
  matrix = MatrixClient.getInstance();
  const flightService = new FlightsService(db);
  const settingsService = new SettingsService(db);
  const flights = flightService.getActiveFlights();

  const brightness = settingsService.getBrightness();
  await matrix.brightness(brightness);
  if (flights.length === 0) {
    await showMetar();
  }
  for (let i = 0; i < flights.length; i++) {
    await showFlight(flights[i], i + 1, flights.length);
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

async function renderFrame(cmds: TextCmd[]): Promise<void> {
  await matrix.clear();
  for (const cmd of cmds) await matrix.send(cmd);
  await matrix.flush();
}

async function hold(cmds: TextCmd[], ms: number): Promise<void> {
  await renderFrame(cmds);
  await sleep(ms);
}

async function scrollLeft(
  scrollingCmd: TextCmd,
  fixedCmds: TextCmd[],
  frameDelayMs: number
): Promise<void> {
  let x = startOffscreenRight(scrollingCmd);
  const w = textWidthPx(scrollingCmd.text);

  while (x + w >= 0) {
    await renderFrame([...fixedCmds, { ...scrollingCmd, x }]);
    await sleep(frameDelayMs);
    x -= 1;
  }
}

function chooseAircraftLine(cmds: FlightTextCmds): TextCmd {
  return needsScroll(cmds.aircraftLong)
    ? cmds.aircraftShort
    : cmds.aircraftLong;
}

async function showFlight(flight: Flight, index: number, total: number) {
  const cmds = flightToTextCmds(flight, index, total);
  const aircraftForStatic = chooseAircraftLine(cmds);

  await hold(
    [
      cmds.flightCount,
      cmds.routeShort,
      cmds.flightNumber,
      aircraftForStatic,
      cmds.altitude,
    ],
    config.matrix.timing.holdMs
  );

  await sleep(config.matrix.timing.betweenScrollsMs);

  await scrollLeft(
    cmds.routeLong,
    [cmds.flightNumber, aircraftForStatic, cmds.altitude],
    config.matrix.timing.routeScrollFrameMs
  );
  await scrollLeft(
    cmds.airlineAndCallsign,
    [cmds.flightCount, cmds.routeShort, aircraftForStatic, cmds.altitude],
    config.matrix.timing.airlineScrollFrameMs
  );
  if (needsScroll(cmds.aircraftLong)) {
    await scrollLeft(
      cmds.aircraftLong,
      [cmds.flightCount, cmds.routeShort, cmds.flightNumber, cmds.altitude],
      config.matrix.timing.aircraftScrollFrameMs
    );
  }

  await hold(
    [
      cmds.flightCount,
      cmds.routeShort,
      cmds.flightNumber,
      aircraftForStatic,
      cmds.altitude,
    ],
    config.matrix.timing.holdMs
  );

  await sleep(config.matrix.timing.betweenScrollsMs);
}

async function showMetar() {
  // TODO: fetch real METAR data
  const metarString =
    "METAR KJFK 121651Z 18015KT 10SM FEW020 SCT250 30/22 A2992 RMK AO2 SLP132 T03000217";
  const now = new Date();
  const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  const tempC = "-30°C";
  const dateString = now.toLocaleDateString("fi-FI", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  const timeCmd: TextCmd = {
    cmd: "text",
    text: timeString,
    y: 8,
    x: 2,
    ...config.matrix.colors.cyan,
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
    ...config.matrix.colors.magenta,
  };
  const metarCmd: TextCmd = {
    cmd: "text",
    text: metarString,
    y: 29,
    x: 2,
    ...config.matrix.colors.grey,
  };
  await scrollLeft(
    metarCmd,
    [timeCmd, tempCmd, dateCmd],
    config.matrix.timing.metarScrollFrameMs
  );
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
    text: `${
      flight.origin?.name?.replace("International Airport", "Intl.") ?? "N/A"
    } - ${
      flight.destination?.name?.replace("International Airport", "Intl.") ??
      "N/A"
    }`,
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
