type LogLevel = "debug" | "info" | "warn" | "error";

const isServer = typeof window === "undefined";
const enabledLevels: LogLevel[] = ["debug", "info", "warn", "error"];

function write(
  level: LogLevel,
  scope: string,
  message: string,
  meta?: unknown,
) {
  if (!enabledLevels.includes(level)) return;

  const line = `[${level.toUpperCase()}] [${scope}] ${message}`;

  if (level === "error" && isServer) {
    if (meta !== undefined) {
      console.error(line, meta);
    } else {
      console.error(line);
    }
    return;
  }

  if (meta !== undefined) {
    if (level === "warn") console.warn(line, meta);
    else console.log(line, meta);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (scope: string, message: string, meta?: unknown) =>
    write("debug", scope, message, meta),
  info: (scope: string, message: string, meta?: unknown) =>
    write("info", scope, message, meta),
  warn: (scope: string, message: string, meta?: unknown) =>
    write("warn", scope, message, meta),
  error: (scope: string, message: string, meta?: unknown) =>
    write("error", scope, message, meta),
};
