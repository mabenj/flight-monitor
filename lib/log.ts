import { configure, getLogger, getConsoleSink } from "@logtape/logtape";
import { getRotatingFileSink } from "@logtape/file";
import path from "node:path";
import { config } from "../config.ts";
import { getPrettyFormatter } from "@logtape/pretty";

let initialized = false;

export async function initializeLogging(): Promise<void> {
  if (initialized) {
    return;
  }

  await Deno.mkdir(path.dirname(config.logging.filename), { recursive: true });

  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: getPrettyFormatter({
          timestamp: "date-time-timezone",
          level: "FULL",
          wordWrap: false,
          categoryWidth: 30,
        }),
      }),
      file: getRotatingFileSink(config.logging.filename, {
        maxSize: config.logging.maxBytes,
        maxFiles: config.logging.maxBackupCount,
      }),
    },
    loggers: [
      {
        category: ["FM"],
        lowestLevel: "debug",
        sinks: ["console", "file"],
      },
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["console"],
      },
    ],
  });

  initialized = true;
}

export function logger(name: string) {
  return getLogger(["FM", name]);
}
