/**
 * Error handling and Response types
 */

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export type ValidationError = {
  reason: string;
};

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public body?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationApiError extends ApiError {
  constructor(message: string, public reason: string) {
    super(400, message, { reason });
    this.name = "ValidationApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message);
    this.name = "NotFoundError";
  }
}

/**
 * Helper to create a successful result
 */
export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Helper to create a failed result
 */
export function err<E extends Error>(error: E): Result<unknown, E> {
  return { success: false, error };
}

/**
 * Type guard to check if result is successful
 */
export function isOk<T, E extends Error>(
  result: Result<T, E>
): result is { success: true; data: T } {
  return result.success;
}
