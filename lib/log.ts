export default class Log {
  constructor(private readonly name: string) {}

  private get timestamp(): string {
    return this.formatTimestamp(new Date());
  }

  debug(message: string): void {
    console.debug(`${this.timestamp} [DEBUG] ${this.getName()}: ${message}`);
  }

  info(message: string): void {
    console.log(`${this.timestamp} [INFO] ${this.getName()}: ${message}`);
  }

  warn(message: string): void {
    console.warn(`${this.timestamp} [WARN] ${this.getName()}: ${message}`);
  }

  error(message: string, error?: Error | unknown): void {
    console.error(
      `${this.timestamp} [ERROR] ${this.getName()}: ${message}`,
      error || ""
    );
  }

  private getName(): string {
    return `[${this.name}]`;
  }

  private formatTimestamp(now: Date): string {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}
