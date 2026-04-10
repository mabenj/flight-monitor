// logging.ts
import {
  configure,
  getLogger,
  getConsoleSink,
  getAnsiColorFormatter,
} from "@logtape/logtape";
import { getRotatingFileSink } from "@logtape/file";
import path from "node:path";
import { config } from "../config.ts";

let initialized = false;

export async function initializeLogging(): Promise<void> {
  if (initialized) {
    return;
  }

  await Deno.mkdir(path.dirname(config.logging.filename), { recursive: true });

  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: getAnsiColorFormatter({
          timestamp: "date-time",
        }),
      }),
      file: getRotatingFileSink(config.logging.filename, {
        maxSize: config.logging.maxBytes,
        maxFiles: config.logging.maxBackupCount,
      }),
    },
    loggers: [
      {
        category: ["fm"],
        lowestLevel: "info",
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
  return getLogger(["fm", name]);
}
