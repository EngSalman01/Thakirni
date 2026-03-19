import { Hono } from "hono"

/** Variables stored in Hono context by auth middleware */
export type AppVariables = {
  userId: string
  accessToken: string
  planTier: string
}

/** Typed Hono app factory */
export type AppEnv = { Variables: AppVariables }

export function createRouter() {
  return new Hono<AppEnv>()
}
