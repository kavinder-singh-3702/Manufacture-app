type LogLevel = "info" | "warn" | "error";

const log = (level: LogLevel, message: string, payload?: unknown) => {
  const timestamp = new Date().toISOString();
  // eslint-disable-next-line no-console
  console[level](`[${timestamp}] ${message}`, payload ?? "");
};

export const logger = {
  info: (message: string, payload?: unknown) => log("info", message, payload),
  warn: (message: string, payload?: unknown) => log("warn", message, payload),
  error: (message: string, payload?: unknown) => log("error", message, payload),
};
