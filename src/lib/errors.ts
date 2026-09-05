export type AppErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(
    code: AppErrorCode,
    message: string,
    options: { status?: number; details?: unknown; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.status = options.status ?? defaultStatusFor(code);
    this.details = options.details;
    this.isOperational = true;
  }
}

function defaultStatusFor(code: AppErrorCode): number {
  switch (code) {
    case "VALIDATION":
      return 400;
    case "NOT_FOUND":
      return 404;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "CONFLICT":
      return 409;
    case "RATE_LIMITED":
      return 429;
    case "INTERNAL":
      return 500;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
