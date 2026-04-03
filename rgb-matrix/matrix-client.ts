import Log from "../lib/log.ts";

export type TextCmd = {
  cmd: "text";
  text: string;
  x?: number;
  y?: number;
  r?: number;
  g?: number;
  b?: number;
  clear?: boolean;
};
export type BrightnessCmd = { cmd: "brightness"; value: number };
export type ClearCmd = { cmd: "clear" };
export type ExitCmd = { cmd: "exit" };
export type FlushCmd = { cmd: "flush" };
export type MatrixCmd = TextCmd | BrightnessCmd | ClearCmd | ExitCmd | FlushCmd;
export type ReadyMsg = { ready: true; font?: boolean };

export class MatrixClient {
  private static instance: MatrixClient | null = null;
  private static instancePromise: Promise<MatrixClient> | null = null;

  private process: Deno.ChildProcess | null = null;
  private readonly encoder = new TextEncoder();
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private readonly log = new Log("MatrixClient");
  private available: boolean = false;

  private constructor() {}

  private async initialize(): Promise<void> {
    if (Deno.build.os !== "linux") {
      this.log.warn(
        `Matrix display not supported on ${Deno.build.os}, all operations will be no-ops`
      );
      return;
    }

    try {
      const command = new Deno.Command("sudo", {
        args: ["-E", "python", "./rgb-matrix/matrixd.py"],
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
      });
      this.process = command.spawn();
      this.writer = this.process.stdin.getWriter();
      const [stdoutForReady, stdoutForLog] = this.process.stdout.tee();
      await readReadyLine(stdoutForReady).catch((error) => {
        this.available = false;
        this.log.error(
          `Python daemon failed to start: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        throw error;
      });
      logStreamLines(
        this.process.stderr,
        this.log.error.bind(this.log),
        "[matrixd] "
      );
      logStreamLines(stdoutForLog, this.log.info.bind(this.log), "[matrixd] ");
      this.available = true;
      this.log.info("Matrix display initialized successfully");
    } catch (error) {
      this.log.error(
        "Failed to initialize matrix display, operations will be no-ops",
        error
      );
      this.available = false;
    }
  }

  static getInstance(): Promise<MatrixClient> {
    if (!MatrixClient.instancePromise) {
      MatrixClient.instancePromise = (async () => {
        const instance = new MatrixClient();
        await instance.initialize();
        MatrixClient.instance = instance;
        return instance;
      })();
    }
    return MatrixClient.instancePromise;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async send(cmd: MatrixCmd) {
    if (!this.available || !this.writer) {
      return MatrixClient.instance!;
    }
    await this.writer.write(this.encoder.encode(JSON.stringify(cmd) + "\n"));
    return MatrixClient.instance!;
  }

  text(text: string, opts: Omit<TextCmd, "cmd" | "text"> = {}) {
    return this.send({ cmd: "text", text, ...opts });
  }

  brightness(value: number) {
    return this.send({ cmd: "brightness", value });
  }

  clear() {
    return this.send({ cmd: "clear" });
  }

  flush() {
    return this.send({ cmd: "flush" });
  }

  async close() {
    if (!this.available || !this.process) {
      this.log.debug("Matrix not available, nothing to close");
      return;
    }
    try {
      await this.send({ cmd: "exit" });
    } catch {
      // ignore (daemon may already be dead)
    }
    try {
      if (this.writer) {
        await this.writer.close();
      }
    } catch {
      // ignore
    }
    try {
      if (this.writer) {
        this.writer.releaseLock();
      }
    } catch {
      // ignore
    }

    const KILL_TIMEOUT_MS = 5_000;

    const killTimer = setTimeout(() => {
      this.log.warn(
        `matrixd did not exit within ${KILL_TIMEOUT_MS}ms, sending SIGKILL`
      );
      try {
        this.process!.kill("SIGKILL");
      } catch {
        // process may have already exited between the check and the kill
      }
    }, KILL_TIMEOUT_MS);

    try {
      await this.process.status;
    } finally {
      clearTimeout(killTimer);
    }
  }
}

async function readReadyLine(
  stdout: ReadableStream<Uint8Array>
): Promise<ReadyMsg> {
  const reader = stdout.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) throw new Error("matrixd exited before sending ready");

    buf += value;
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;

      try {
        const msg = JSON.parse(line);
        if (msg?.ready === true) return msg as ReadyMsg;
      } catch {
        // ignore non-JSON lines
      }
    }
  }
}

function logStreamLines(
  stream: ReadableStream<Uint8Array>,
  log: (line: string) => void,
  prefix = ""
) {
  (async () => {
    const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;

      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, idx).replace(/\r$/, "");
        buf = buf.slice(idx + 1);
        if (line.length) log(prefix ? `${prefix}${line}` : line);
      }
    }
    const tail = buf.trim();
    if (tail) log(prefix ? `${prefix}${tail}` : tail);
  })();
}
