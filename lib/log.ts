import * as stdLog from "@std/log";
import { RotatingFileHandler } from "@std/log/rotating-file-handler";
import { ConsoleHandler } from "@std/log/console-handler";
import { config } from "../config.ts";
import path from "node:path";

export default class Log {
  private readonly logger: stdLog.Logger;

  constructor(private readonly name: string) {
    stdLog.setup({
      handlers: {
        console: new ConsoleHandler(config.logging.level, {
          formatter: (record) =>
            `${formatTimestamp(record.datetime)} [${record.levelName}] [${
              record.loggerName
            }]: ${record.msg}`,
          useColors: true,
        }),
        file: new RotatingFileHandler(config.logging.level, {
          filename: config.logging.filename,
          maxBytes: config.logging.maxBytes,
          maxBackupCount: config.logging.maxBackupCount,
          formatter: (record) =>
            `${formatTimestamp(record.datetime)} [${record.levelName}] [${
              record.loggerName
            }]: ${record.msg}`,
        }),
      },
      loggers: {
        [name]: {
          level: config.logging.level,
          handlers: ["console", "file"],
        },
      },
    });

    this.logger = stdLog.getLogger(name);
  }

  static async initialize() {
    await Deno.mkdir(path.dirname(config.logging.filename), {
      recursive: true,
    });
  }

  debug(message: string): void {
    this.logger.debug(message);
  }

  info(message: string): void {
    this.logger.info(message);
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  error(message: string, error?: Error | unknown): void {
    const detail = error
      ? ` | ${
          error instanceof Error ? error.stack ?? error.message : String(error)
        }`
      : "";
    this.logger.error(`${message}${detail}`);
  }
}

function formatTimestamp(date: Date) {
  return date.toISOString().replace("T", " ").slice(0, 19);
}
