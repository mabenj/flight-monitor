import * as stdLog from "@std/log";
import { RotatingFileHandler } from "@std/log/rotating-file-handler";
import { ConsoleHandler } from "@std/log/console-handler";

const LOG_DIR = "./logs";
const LOG_FILE = `${LOG_DIR}/app.log`;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_BACKUP_COUNT = 5;

export default class Log {
  private readonly logger: stdLog.Logger;

  constructor(private readonly name: string) {
    // Each instance gets its own named logger, inheriting the default config
    // if not explicitly overridden in setupLogging().
    stdLog.setup({
      handlers: stdLog.getLogger().handlers
        ? {} // handlers already configured, avoid re-creating them
        : {},
      loggers: {
        [name]: {
          level: "DEBUG",
          handlers: ["console", "file"],
        },
      },
    });

    this.logger = stdLog.getLogger(name);
  }

  static async setupLogging() {
    await Deno.mkdir(LOG_DIR, { recursive: true });

    stdLog.setup({
      handlers: {
        console: new ConsoleHandler("DEBUG", {
          formatter: (record) =>
            `${formatTimestamp(record.datetime)} [${record.levelName}] [${
              record.loggerName
            }]: ${record.msg}`,
          useColors: true,
        }),
        file: new RotatingFileHandler("DEBUG", {
          filename: LOG_FILE,
          maxBytes: MAX_BYTES,
          maxBackupCount: MAX_BACKUP_COUNT,
          formatter: (record) =>
            `${formatTimestamp(record.datetime)} [${record.levelName}] [${
              record.loggerName
            }]: ${record.msg}`,
        }),
      },
      loggers: {
        default: {
          level: "DEBUG",
          handlers: ["console", "file"],
        },
      },
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
