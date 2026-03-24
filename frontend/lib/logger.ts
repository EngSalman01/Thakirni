/**
 * Structured logger for production-safe logging.
 * In development: pretty-prints to console.
 * In production: emits structured JSON for log aggregation (Vercel, Datadog, etc.)
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  [key: string]: unknown
}

const isDev = process.env.NODE_ENV !== "production"

function emit(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }

  if (isDev) {
    const prefix = { debug: "🔍", info: "ℹ️", warn: "⚠️", error: "❌" }[level]
    const extra = meta ? " " + JSON.stringify(meta, null, 2) : ""
    if (level === "error") console.error(`${prefix} [${entry.timestamp}] ${message}${extra}`)
    else if (level === "warn") console.warn(`${prefix} [${entry.timestamp}] ${message}${extra}`)
    else console.log(`${prefix} [${entry.timestamp}] ${message}${extra}`)
  } else {
    // In production, emit a single JSON line — captured by Vercel log drains
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => emit("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit("error", message, meta),
}
