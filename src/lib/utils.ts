export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
