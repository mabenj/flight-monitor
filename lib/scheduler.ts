/**
 * Background task scheduler
 */

import { scrapeActiveFlights } from "../tasks/scrape-active-flights.ts";
import {
  displayStartingUp,
  updateMatrixDisplay,
} from "../tasks/matrix-display.ts";
import { AppContext } from "./context.ts";
import Log from "./log.ts";
import { config } from "../config.ts";
import { scrapeWeather } from "../tasks/scrape-weather.ts";
import { sleep } from "./utils.ts";
import { BoundsChangedEvent, BrightnessChangedEvent } from "./events.ts";

export class TaskScheduler {
  private scrapeIntervalId: number | null = null;
  private matrixTimeoutId: number | null = null;
  private running = false;
  private logger = new Log("scheduler");
  private flightMonitorEventListener: (event: Event) => Promise<void>;
  private abortController: AbortController | null = null;

  constructor(private ctx: AppContext) {
    this.flightMonitorEventListener = async (event: Event) => {
      if (event instanceof BoundsChangedEvent) {
        this.logger.info("Bounds changed, restarting scheduler");
        await this.restart();
      } else if (event instanceof BrightnessChangedEvent) {
        this.logger.info("Brightness changed, updating matrix display");
        try {
          this.ctx.matrix.brightness(event.brightness);
        } catch (error) {
          this.logger.error("Failed to update matrix brightness", error);
        }
      }
    };
  }

  async restart() {
    this.stop();
    await sleep(200);
    this.start();
  }

  start(): void {
    if (this.running) {
      this.logger.warn("Scheduler already running");
      return;
    }

    this.running = true;
    this.abortController = new AbortController();
    this.logger.info("Starting task scheduler");

    this.ctx.events.addEventListener(
      "flight-monitor-event",
      this.flightMonitorEventListener
    );

    this.startScrapeTask();
    this.startMatrixTask();
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;
    this.logger.info("Stopping task scheduler");

    // Abort all running tasks immediately
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.scrapeIntervalId !== null) {
      clearInterval(this.scrapeIntervalId);
      this.scrapeIntervalId = null;
    }

    if (this.matrixTimeoutId !== null) {
      clearTimeout(this.matrixTimeoutId);
      this.matrixTimeoutId = null;
    }

    this.ctx.events.removeEventListener(
      "flight-monitor-event",
      this.flightMonitorEventListener
    );
  }

  private startScrapeTask(): void {
    const emptyActiveFlights = () => {
      this.ctx.flightsService.setActiveFlights([]);
    };
    const runScrapeTask = async () => {
      try {
        await scrapeActiveFlights(this.ctx, this.abortController?.signal);
        await scrapeWeather(this.ctx, this.abortController?.signal);
      } catch (error) {
        // Silence AbortError, log other errors
        if (error instanceof DOMException && error.name === "AbortError") {
          this.logger.debug("Scrape task was cancelled");
        } else {
          this.logger.error("Scrape task failed", error);
        }
      }

      if (!this.running && this.scrapeIntervalId !== null) {
        clearInterval(this.scrapeIntervalId);
        this.scrapeIntervalId = null;
      }
    };
    emptyActiveFlights();
    runScrapeTask().then(() => {
      if (this.abortController?.signal.aborted) {
        this.logger.debug(
          "Scrape task was cancelled before scheduling next run"
        );
        return;
      }
      this.scrapeIntervalId = setInterval(
        runScrapeTask,
        config.tasks.scrapeInterval
      );
    });
  }

  private startMatrixTask(): void {
    const runMatrixTask = async () => {
      let cancelled = false;
      try {
        await updateMatrixDisplay(this.ctx, this.abortController!.signal);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          this.logger.debug("Matrix task was cancelled");
          cancelled = true;
        } else {
          this.logger.error("Matrix task failed", error);
        }
      }

      if (!cancelled && this.running && !this.abortController?.signal.aborted) {
        this.matrixTimeoutId = setTimeout(runMatrixTask, 0);
      } else {
        this.matrixTimeoutId && clearTimeout(this.matrixTimeoutId);
        this.matrixTimeoutId = null;
        this.ctx.matrix.clear();
      }
    };

    displayStartingUp(this.ctx).then(() => runMatrixTask());
  }

  isRunning(): boolean {
    return this.running;
  }
}
