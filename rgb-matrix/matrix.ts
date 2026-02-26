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
export type MatrixCmd = TextCmd | BrightnessCmd | ClearCmd | ExitCmd;
export type ReadyMsg = { ready: true; font?: boolean };

export class MatrixClient {
  private static instance: MatrixClient | null = null;
  private readonly process: Deno.ChildProcess;
  private readonly encoder = new TextEncoder();
  private readonly writer: WritableStreamDefaultWriter<Uint8Array>;
  private readonly ready: Promise<ReadyMsg>;
  private readonly log = new Log("MatrixClient");

  private constructor() {
    const command = new Deno.Command("sudo", {
      args: ["-E", "python", "./matrixd.py"],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });
    this.process = command.spawn();
    this.writer = this.process.stdin.getWriter();
    const [stdoutForReady, stdoutForLog] = this.process.stdout.tee();
    this.ready = readReadyLine(stdoutForReady);
    logStreamLines(
      this.process.stderr,
      this.log.error.bind(this.log),
      "[matrixd] "
    );
    logStreamLines(stdoutForLog, this.log.info.bind(this.log), "[matrixd] ");
  }

  static getInstance() {
    if (!MatrixClient.instance) {
      MatrixClient.instance = new MatrixClient();
    }
    return MatrixClient.instance;
  }

  async send(cmd: MatrixCmd) {
    await this.ready;
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

  async close() {
    try {
      await this.send({ cmd: "exit" });
    } catch {
      // ignore (daemon may already be dead)
    }
    try {
      await this.writer.close();
    } catch {
      // ignore
    }
    try {
      this.writer.releaseLock();
    } catch {
      // ignore
    }
    return await this.process.status;
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
