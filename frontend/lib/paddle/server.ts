import { Environment, LogLevel, Paddle } from "@paddle/paddle-node-sdk"

type PaddleEnvironmentName = "production" | "sandbox"

function normalizeEnvValue(value: string | undefined | null): string | null {
  if (!value) return null
  const normalized = value.trim().replace(/^['"]|['"]$/g, "").replace(/^Bearer\s+/i, "")
  return normalized || null
}

function isStandardApiKey(value: string): boolean {
  return /^pdl_(live|sdbx)_apikey_/.test(value)
}

function isLegacyApiKey(value: string): boolean {
  return /^[A-Za-z0-9]{40,}$/.test(value)
}

function isApiKeyEntityId(value: string): boolean {
  return /^apikey_/.test(value)
}

export function getPaddleEnvironmentName(apiKey?: string): PaddleEnvironmentName {
  const explicit = normalizeEnvValue(process.env.PADDLE_ENVIRONMENT)
    ?? normalizeEnvValue(process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT)

  if (explicit === "production" || explicit === "sandbox") {
    return explicit
  }

  if (apiKey?.startsWith("pdl_sdbx_")) return "sandbox"
  return "production"
}

export function getPaddleEnvironment(apiKey?: string): Environment {
  return getPaddleEnvironmentName(apiKey) === "production"
    ? Environment.production
    : Environment.sandbox
}

export function getPaddleApiKey(): string {
  const candidates = [
    { name: "PADDLE_API_SECRET_KEY", value: normalizeEnvValue(process.env.PADDLE_API_SECRET_KEY) },
    { name: "PADDLE_API_KEY", value: normalizeEnvValue(process.env.PADDLE_API_KEY) },
  ]

  for (const candidate of candidates) {
    if (!candidate.value) continue
    if (isStandardApiKey(candidate.value) || isLegacyApiKey(candidate.value)) {
      return candidate.value
    }
  }

  for (const candidate of candidates) {
    if (!candidate.value) continue

    if (isApiKeyEntityId(candidate.value)) {
      throw new Error(
        `${candidate.name} is set to a Paddle API key ID (${candidate.value.slice(0, 12)}...) instead of the secret API key. Use the full key that starts with pdl_live_apikey_ or pdl_sdbx_apikey_.`
      )
    }

    throw new Error(
      `${candidate.name} is not a valid Paddle secret API key. Expected a key like pdl_live_apikey_... or a legacy key value.`
    )
  }

  throw new Error(
    "Paddle is not configured. Set PADDLE_API_SECRET_KEY to a valid secret API key."
  )
}

export function createPaddleServerClient(): Paddle {
  const apiKey = getPaddleApiKey()
  return new Paddle(apiKey, {
    environment: getPaddleEnvironment(apiKey),
    logLevel: LogLevel.error,
  })
}

