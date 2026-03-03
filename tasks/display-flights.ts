import { DatabaseSync } from "node:sqlite";
import { formatAltitude, sleep } from "../lib/utils.ts";
import { Flight } from "../types/flight.ts";
import { MatrixClient, type TextCmd } from "../rgb-matrix/matrix.ts";

const matrix = MatrixClient.getInstance();

const DISPLAY = { widthPx: 64, fontWidthPx: 5 };

const TIMING = {
  holdMs: 2000,
  betweenScrollsMs: 1000,
  routeScrollFrameMs: 20,
  airlineScrollFrameMs: 20,
  aircraftScrollFrameMs: 20,
  metarScrollFrameMs: 40,
};

const COLORS = {
  white: { r: 255, g: 255, b: 255 },
  magenta: { r: 210, g: 50, b: 235 },
  cyan: { r: 50, g: 210, b: 235 },
  green: { r: 37, g: 242, b: 10 },
  orange: { r: 255, g: 165, b: 0 },
  grey: { r: 128, g: 128, b: 128 },
};

type FlightTextCmds = ReturnType<typeof flightToTextCmds>;

export async function displayFlights(db: DatabaseSync) {
  await matrix.brightness(100);
  if (flights.length === 0) {
    await showMetar();
  }
  for (let i = 0; i < flights.length; i++) {
    await showFlight(flights[i], i + 1, flights.length);
  }
}

function textWidthPx(text: string): number {
  return text.length * DISPLAY.fontWidthPx;
}

function needsScroll(cmd: TextCmd): boolean {
  return textWidthPx(cmd.text) > DISPLAY.widthPx - 4;
}

function startOffscreenRight(cmd: TextCmd): number {
  const baseX = cmd.x ?? 2;
  return baseX + (DISPLAY.widthPx - 2);
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
    TIMING.holdMs
  );

  await sleep(TIMING.betweenScrollsMs);

  await scrollLeft(
    cmds.routeLong,
    [cmds.flightNumber, aircraftForStatic, cmds.altitude],
    TIMING.routeScrollFrameMs
  );
  await scrollLeft(
    cmds.airlineAndCallsign,
    [cmds.flightCount, cmds.routeShort, aircraftForStatic, cmds.altitude],
    TIMING.airlineScrollFrameMs
  );
  if (needsScroll(cmds.aircraftLong)) {
    await scrollLeft(
      cmds.aircraftLong,
      [cmds.flightCount, cmds.routeShort, cmds.flightNumber, cmds.altitude],
      TIMING.aircraftScrollFrameMs
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
    TIMING.holdMs
  );

  await sleep(TIMING.betweenScrollsMs);
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
    ...COLORS.cyan,
  };
  const tempCmd: TextCmd = {
    cmd: "text",
    text: tempC,
    y: 8,
    x: 62 - tempC.length * DISPLAY.fontWidthPx,
    ...COLORS.white,
  };
  const dateCmd: TextCmd = {
    cmd: "text",
    text: dateString,
    y: 15,
    x: 2,
    ...COLORS.magenta,
  };
  const metarCmd: TextCmd = {
    cmd: "text",
    text: metarString,
    y: 29,
    x: 2,
    ...COLORS.grey,
  };
  await scrollLeft(
    metarCmd,
    [timeCmd, tempCmd, dateCmd],
    TIMING.metarScrollFrameMs
  );
}

const now = Math.floor(Date.now() / 1000);
const mkTime = (deltaSeconds: number) => now + deltaSeconds;

const flights: Flight[] = [
  {
    id: "tku-1",
    callsign: "AY123",
    flightNumber: "AY123",
    aircraft: {
      modelCode: "A320",
      registration: "OH-LKA",
      modelText: "Airbus A320",
    },
    airline: { iata: "AY", icao: "FIN", name: "Finnair" },
    arrivalTime: {
      scheduled: mkTime(1800),
      estimated: mkTime(1800),
      actual: 0,
    },
    departureTime: {
      scheduled: mkTime(-1800),
      estimated: mkTime(-1750),
      actual: mkTime(-1700),
    },
    origin: {
      iata: "HEL",
      icao: "EFHK",
      name: "Helsinki Airport",
    },
    destination: {
      iata: "TKU",
      icao: "EFTU",
      name: "Turku Airport",
    },
    altitude: 12000,
    groundSpeed: 300,
    heading: 200,
    timestamp: now,
  },
  {
    id: "tku-2",
    callsign: "OH567",
    flightNumber: "OH567",
    aircraft: {
      modelCode: "AT72",
      registration: "OH-AT7",
      modelText: "ATR 72",
    },
    airline: { iata: "F2", icao: "FIN", name: "Ålandstrafik" },
    arrivalTime: {
      scheduled: mkTime(3600),
      estimated: mkTime(3650),
      actual: 0,
    },
    departureTime: {
      scheduled: mkTime(-7200),
      estimated: mkTime(-7100),
      actual: mkTime(-7000),
    },
    origin: {
      iata: "GOT",
      icao: "ESGG",
      name: "Gothenburg Landvetter Airport",
    },
    destination: {
      iata: "TKU",
      icao: "EFTU",
      name: "Turku Airport",
    },
    altitude: 5000,
    groundSpeed: 200,
    heading: 180,
    timestamp: now,
  },
  {
    id: "tku-3",
    callsign: "RYR45",
    flightNumber: "FR45",
    aircraft: {
      modelCode: "B738",
      registration: "EI-FRO",
      modelText: "Boeing 737-800",
    },
    airline: { iata: "FR", icao: "RYR", name: "Ryanair" },
    arrivalTime: {
      scheduled: mkTime(5400),
      estimated: mkTime(5400),
      actual: 0,
    },
    departureTime: {
      scheduled: mkTime(-3600),
      estimated: mkTime(-3500),
      actual: mkTime(-3400),
    },
    origin: {
      iata: "VAA",
      icao: "EFVA",
      name: "Vaasa Airport",
    },
    destination: {
      iata: "TKU",
      icao: "EFTU",
      name: "Turku Airport",
    },
    altitude: 8000,
    groundSpeed: 250,
    heading: 220,
    timestamp: now,
  },
];

function flightToTextCmds(flight: Flight, index = 1, total = 1) {
  const countText = total > 1 ? `${index}/${total}` : "";

  const flightCount: TextCmd = {
    cmd: "text",
    text: countText,
    y: 8,
    x: total > 1 ? 62 - countText.length * DISPLAY.fontWidthPx : 64,
    ...COLORS.white,
  };

  const routeShort: TextCmd = {
    cmd: "text",
    text: `${flight.origin?.iata ?? "N/A"}-${
      flight.destination?.iata ?? "N/A"
    }`,
    y: 8,
    x: 2,
    ...COLORS.magenta,
  };

  const routeLong: TextCmd = {
    cmd: "text",
    text: `${
      flight.origin?.name.replace("International Airport", "Intl.") ?? "N/A"
    } - ${
      flight.destination?.name.replace("International Airport", "Intl.") ??
      "N/A"
    }`,
    y: 8,
    x: 2,
    ...COLORS.magenta,
  };

  const flightNumber: TextCmd = {
    cmd: "text",
    text: flight.flightNumber ?? flight.callsign ?? "N/A",
    y: 15,
    x: 2,
    ...COLORS.white,
  };

  const airlineAndCallsign: TextCmd = {
    cmd: "text",
    text: `${flight.airline?.name ?? "N/A"} ${flight.callsign ?? "N/A"}`,
    y: 15,
    x: 2,
    ...COLORS.white,
  };

  const aircraftShort: TextCmd = {
    cmd: "text",
    text: flight.aircraft?.modelCode ?? flight.aircraft?.registration ?? "N/A",
    y: 22,
    x: 2,
    ...COLORS.cyan,
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
    ...COLORS.cyan,
  };

  const altitude: TextCmd = {
    cmd: "text",
    text: flight.altitude > 0 ? formatAltitude(flight.altitude) : "ON GROUND",
    y: 29,
    x: 2,
    ...COLORS.green,
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
