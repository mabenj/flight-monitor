export function distinctBy<T, K extends keyof T>(
  array: T[],
  key: K,
  key2?: K
): T[] {
  const seen: Set<T[K]> = new Set();
  return array.filter((item) => {
    const value: T[K] = item[key] ?? item[key2!];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Safely gets nested property by dot-notation path.
 */
// deno-lint-ignore no-explicit-any
export function getNested<T extends Record<string, any>, K extends string, R>(
  obj: T,
  path: K
): R | undefined {
  const keys = path.split(".");
  // deno-lint-ignore no-explicit-any
  let current: any = obj;

  for (const key of keys) {
    if (current == null || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }
  return current ?? undefined;
}

/**
 * Gets nested property with default value.
 */
export function getNestedOrDefault<T, K extends string, D>(
  obj: T,
  path: K,
  defaultValue: D
): D {
  const keys = path.split(".");
  // deno-lint-ignore no-explicit-any
  let current: any = obj;

  for (const key of keys) {
    if (current == null || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }
  return current ?? defaultValue;
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timeoutId = setTimeout(resolve, ms);
    const abortHandler = () => {
      clearTimeout(timeoutId);
      reject(new DOMException("Aborted", "AbortError"));
    };

    signal?.addEventListener("abort", abortHandler, { once: true });
  });
}

/**
 * Delay execution for a given number of milliseconds with AbortSignal support.
 * Throws AbortError if signal is aborted during the delay.
 */
export const delay = sleep;
