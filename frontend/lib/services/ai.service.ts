import { createGoogleGenerativeAI } from "@ai-sdk/google"

const _google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })

export function getGoogle() {
  return _google
}

export function getAiModel() {
  return _google("gemini-flash-latest")
}

export function getFastModel() {
  return _google("gemini-flash-latest")
}
