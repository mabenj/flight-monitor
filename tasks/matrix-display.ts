import { sleep } from "../lib/utils.ts";
import { Flight } from "../types/flight.ts";
import { MatrixClient, type TextCmd } from "../rgb-matrix/matrix-client.ts";
import { config } from "../config.ts";
import { Weather } from "../types/weather.ts";
import { ElectricityPrice } from "../types/electricity-price.ts";
import { AppContext } from "../lib/context.ts";

type FlightTextCmds = ReturnType<typeof flightToTextCmds>;

/**
 * How many times sendFlightsToMatrix has been called. Used to decide whether
 * to scroll the METAR or just show the static weather screen.
 */
let callCount = 0;
let lastInfo: "metar" | "prices" | null = null;

export async function updateMatrixDisplay(ctx: AppContext): Promise<void> {
  const {
    matrix,
    flightsService,
    weatherService,
    boundsService,
    priceService,
    settingsService,
  } = ctx;

  callCount++;

  await matrix.brightness(settingsService.getBrightness());

  let flights = flightsService.getActiveFlights();
  if (flights.length === 0) {
    const bounds = boundsService.getActive();
    const weather = bounds?.airportCode
      ? weatherService.getWeather(bounds.airportCode)
      : null;
    const prices = await priceService.getCurrentAndUpcomingPrices();
    const shouldScroll = callCount % config.matrix.infoScrollEveryNFrames === 0;
    await showInfoScreen(
      matrix,
      weather,
      prices,
      shouldScroll && lastInfo === "prices",
      shouldScroll && lastInfo === "metar"
    );
    if (shouldScroll) {
      lastInfo = lastInfo === "metar" ? "prices" : "metar";
    }
    return;
  }

  for (let i = 0; i < flights.length; i++) {
    flights = flightsService.getActiveFlights();
    if (i >= flights.length) {
      break;
    }
    await showFlight(matrix, flights[i], i + 1, flights.length);
  }
}

async function showInfoScreen(
  matrix: MatrixClient,
  weather: Weather | null,
  electricityPrices: ElectricityPrice[],
  scrollMetar: boolean,
  scrollPrices: boolean
): Promise<void> {
  const now = new Date();

  const timeString = formatTime(now);
  const dateString = formatDate(now);
  const pricesString = formatPrices(electricityPrices);
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
  } else if (scrollPrices && electricityPrices.length > 0) {
    const priceCmd: TextCmd = {
      cmd: "text",
      text: pricesString,
      y: 29,
      x: 2,
      ...config.matrix.colors.grey,
    };
    await scrollLeft(
      matrix,
      priceCmd,
      staticCmds,
      config.matrix.timing.priceScrollFrameMs
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

  if (flight.origin?.name || flight.destination?.name) {
    await scrollLeft(
      matrix,
      cmds.routeLong,
      [cmds.flightNumber, aircraftForStatic, cmds.altitude],
      config.matrix.timing.routeScrollFrameMs
    );
  }

  if (cmds.airlineAndCallsign.text.trim()) {
    await scrollLeft(
      matrix,
      cmds.airlineAndCallsign,
      [cmds.flightCount, cmds.routeShort, aircraftForStatic, cmds.altitude],
      config.matrix.timing.airlineScrollFrameMs
    );
  }

  if (needsScroll(cmds.aircraftLong)) {
    await scrollLeft(
      matrix,
      cmds.aircraftLong,
      [cmds.flightCount, cmds.routeShort, cmds.flightNumber, cmds.altitude],
      config.matrix.timing.aircraftScrollFrameMs
    );
  }

  if (cmds.speedAndHeading.text.trim()) {
    await scrollLeft(
      matrix,
      cmds.speedAndHeading,
      [cmds.flightCount, cmds.routeShort, cmds.flightNumber, aircraftForStatic],
      config.matrix.timing.speedAndHeadingScrollFrameMs
    );
  }

  if (cmds.schedule.text.trim()) {
    await scrollLeft(
      matrix,
      cmds.schedule,
      [cmds.flightCount, cmds.routeShort, cmds.flightNumber, aircraftForStatic],
      config.matrix.timing.scheduleScrollFrameMs
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
    config.matrix.displayWidthPx - 2
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

function formatPrices(prices: ElectricityPrice[]): string {
  const pricesString = prices
    .map((p) => {
      const hour = new Date(p.startDate * 1000)
        .getHours()
        .toString()
        .padStart(2, "0");
      const price = p.price.toFixed(1);
      return `H${hour} ${price}c`;
    })
    .join("  ");
  return pricesString;
}

function getFlightScheduleText(flight: Flight): string {
  const NOW_THRESHOLD_SECONDS = 60;
  const SPEED_THRESHOLD_KNOTS = 50;

  const departureTime =
    flight.departureTime?.actual ??
    flight.departureTime?.estimated ??
    flight.departureTime?.scheduled;
  const arrivalTime =
    flight.arrivalTime?.actual ??
    flight.arrivalTime?.estimated ??
    flight.arrivalTime?.scheduled;

  if (!departureTime && !arrivalTime) {
    return "";
  }

  const now = Date.now() / 1000;
  const timeToDeparture = (departureTime ?? Number.MAX_SAFE_INTEGER) - now;
  const timeToArrival = (arrivalTime ?? Number.MAX_SAFE_INTEGER) - now;

  if (departureTime && Math.abs(timeToDeparture) < Math.abs(timeToArrival)) {
    if (Math.abs(timeToDeparture) < NOW_THRESHOLD_SECONDS) {
      return "Departing now";
    }
    if (flight.departureTime.actual) {
      return `Departed ${formatSeconds(Math.abs(timeToDeparture))} ago`;
    }
    if (timeToDeparture > 0) {
      return `Departing in ${formatSeconds(timeToDeparture)}`;
    } else if (flight.groundSpeed < SPEED_THRESHOLD_KNOTS) {
      return `Departing late ${formatSeconds(-timeToDeparture)}`;
    } else {
      return `Departed ${formatSeconds(-timeToDeparture)} ago`;
    }
  }

  if (arrivalTime && Math.abs(timeToArrival) < Math.abs(timeToDeparture)) {
    if (Math.abs(timeToArrival) < NOW_THRESHOLD_SECONDS) {
      return "Landing now";
    }
    if (flight.arrivalTime.actual) {
      return `Landed ${formatSeconds(Math.abs(timeToArrival))} ago`;
    }
    if (timeToArrival > 0) {
      return `Landing in ${formatSeconds(timeToArrival)}`;
    } else if (flight.groundSpeed > SPEED_THRESHOLD_KNOTS) {
      return `Landing late ${formatSeconds(-timeToArrival)}`;
    } else {
      return `Landed ${formatSeconds(-timeToArrival)} ago`;
    }
  }

  return "";
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
    text: getFlightRouteShort(flight),
    y: 8,
    x: 2,
    ...config.matrix.colors.magenta,
  };

  const routeLong: TextCmd = {
    cmd: "text",
    text: getFlightRouteLong(flight),
    y: 8,
    x: 2,
    ...config.matrix.colors.magenta,
  };

  const flightNumber: TextCmd = {
    cmd: "text",
    text: flight.flightNumber ?? flight.aircraft?.registration ?? "",
    y: 15,
    x: 2,
    ...config.matrix.colors.white,
  };

  const airlineAndCallsign: TextCmd = {
    cmd: "text",
    text: `${flight.airline?.name ?? ""} ${
      flight.callsign ?? flight.aircraft?.registration ?? ""
    }`.replace("Blocked", ""),
    y: 15,
    x: 2,
    ...config.matrix.colors.white,
  };

  const aircraftShort: TextCmd = {
    cmd: "text",
    text: flight.aircraft?.modelCode ?? flight.aircraft?.registration ?? "",
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
      "",
    y: 22,
    x: 2,
    ...config.matrix.colors.cyan,
  };

  const altitude: TextCmd = {
    cmd: "text",
    text:
      flight.altitude > 0
        ? `${Math.round(flight.altitude / 100) * 100}ft`
        : "ON GROUND",
    y: 29,
    x: 2,
    ...config.matrix.colors.green,
  };

  const speedAndHeading: TextCmd = {
    cmd: "text",
    text: `${flight.groundSpeed > 0 ? `GS ${flight.groundSpeed}kts ` : ""}${
      flight.heading > 0 ? `HDG ${flight.heading}°` : ""
    }`,
    y: 29,
    x: 2,
    ...config.matrix.colors.green,
  };

  const schedule: TextCmd = {
    cmd: "text",
    text: getFlightScheduleText(flight),
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
    schedule,
    speedAndHeading,
  };
}

function normalizeAirportName(name: string | undefined | null): string {
  return name?.replace("International Airport", "Intl.") ?? "Unknown airport";
}

function formatSeconds(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function getFlightRouteShort(flight: Flight): string {
  if (flight.origin && flight.destination) {
    return `${flight.origin.iata}-${flight.destination.iata}`;
  }
  if (flight.origin) {
    return `FROM ${flight.origin.iata}`;
  }
  if (flight.destination) {
    return `TO ${flight.destination.iata}`;
  }

  return "???";
}

function getFlightRouteLong(flight: Flight): string {
  if (!flight.origin?.name && !flight.destination?.name) {
    return "Unknown route";
  }
  return `${normalizeAirportName(flight.origin.name)} - ${normalizeAirportName(
    flight.destination.name
  )}`;
}
