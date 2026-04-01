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

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatAltitude(alt: number): string {
  return alt >= 6000 ? `FL${Math.round(Math.round(alt / 100))}` : `${alt}ft`;
}

export function prettyNumber(num: number, roundTo = 100): string {
  const rounded = Math.round(num / roundTo) * roundTo;
  return new Intl.NumberFormat("en-US").format(rounded);
}
