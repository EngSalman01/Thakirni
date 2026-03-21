import { createGroq } from "@ai-sdk/groq"
import Groq from "groq-sdk"

let _groq: ReturnType<typeof createGroq> | null = null
let _groqSDK: Groq | null = null

export function getGroq() {
  if (!_groq) _groq = createGroq({ apiKey: process.env.GROQ_API_KEY! })
  return _groq
}

export function getGroqSDK(): Groq {
  if (!_groqSDK) _groqSDK = new Groq({ apiKey: process.env.GROQ_API_KEY! })
  return _groqSDK
}

export function getAiModel() {
  return getGroq()("llama-3.3-70b-versatile")
}

export function getFastModel() {
  return getGroq()("llama-3.1-8b-instant")
}
