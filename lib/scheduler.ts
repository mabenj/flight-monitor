/**
 * Background task scheduler
 */

import { scrapeActiveFlights } from "../tasks/scrape-active-flights.ts";
import { updateMatrixDisplay } from "../tasks/matrix-display.ts";
import { AppContext } from "./context.ts";
import Log from "./log.ts";
import { config } from "../config.ts";
import { scrapeWeather } from "../tasks/scrape-weather.ts";

export class TaskScheduler {
  private scrapeIntervalId: number | null = null;
  private matrixTimeoutId: number | null = null;
  private running = false;
  private logger = new Log("scheduler");
  private settingsChangeListener: (event: Event) => void;

  constructor(private ctx: AppContext) {
    this.settingsChangeListener = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.type === "bounds") {
        this.logger.info("Bounds changed, restarting scheduler");
        this.restart();
      }
    };
  }

  restart(): void {
    this.stop();
    this.start();
  }

  start(): void {
    if (this.running) {
      this.logger.warn("Scheduler already running");
      return;
    }

    this.running = true;
    this.logger.info("Starting task scheduler");

    this.ctx.events.addEventListener(
      "settingsChanged",
      this.settingsChangeListener
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

    if (this.scrapeIntervalId !== null) {
      clearInterval(this.scrapeIntervalId);
      this.scrapeIntervalId = null;
    }

    if (this.matrixTimeoutId !== null) {
      clearTimeout(this.matrixTimeoutId);
      this.matrixTimeoutId = null;
    }

    this.ctx.events.removeEventListener(
      "settingsChanged",
      this.settingsChangeListener
    );
  }

  private startScrapeTask(): void {
    const emptyActiveFlights = () => {
      this.ctx.flightsService.setActiveFlights([]);
    };
    const runScrapeTask = async () => {
      try {
        await scrapeActiveFlights(this.ctx);
        await scrapeWeather(this.ctx);
      } catch (error) {
        this.logger.error("Scrape task failed", error);
      }

      if (!this.running && this.scrapeIntervalId !== null) {
        clearInterval(this.scrapeIntervalId);
        this.scrapeIntervalId = null;
      }
    };
    emptyActiveFlights();
    runScrapeTask().then(() => {
      this.scrapeIntervalId = setInterval(
        runScrapeTask,
        config.tasks.scrapeInterval
      );
    });
  }

  private startMatrixTask(): void {
    const runMatrixTask = async () => {
      try {
        await updateMatrixDisplay(this.ctx);
      } catch (error) {
        this.logger.error("Matrix task failed", error);
      }

      if (!this.running && this.matrixTimeoutId !== null) {
        clearTimeout(this.matrixTimeoutId);
        this.matrixTimeoutId = null;
      } else if (this.running) {
        this.matrixTimeoutId = setTimeout(runMatrixTask, 0);
      }
    };

    runMatrixTask();
  }

  isRunning(): boolean {
    return this.running;
  }
}
