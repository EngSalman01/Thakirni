import "dotenv/config"
import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"

import { meetingsRouter } from "./routes/meetings.js"
import { goalsRouter } from "./routes/goals.js"
import { habitsRouter } from "./routes/habits.js"
import { focusRouter } from "./routes/focus.js"
import { documentsRouter } from "./routes/documents.js"
import { webhooksRouter } from "./routes/webhooks.js"
import { subscriptionsRouter } from "./routes/subscriptions.js"

const app = new Hono()

// ── Global middleware ────────────────────────────────────────────────────────

app.use("*", logger())
app.use("*", prettyJSON())
app.use(
  "/api/*",
  cors({
    origin: [
      process.env.FRONTEND_URL ?? "http://localhost:3000",
      "https://thakirni.com",
      "https://www.thakirni.com",
    ],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  })
)

// ── Routes ────────────────────────────────────────────────────────────────────

app.route("/api/meetings", meetingsRouter)
app.route("/api/goals", goalsRouter)
app.route("/api/habits", habitsRouter)
app.route("/api/focus", focusRouter)
app.route("/api/documents", documentsRouter)
app.route("/api/webhooks", webhooksRouter)
app.route("/api/subscriptions", subscriptionsRouter)

// ── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "Thakirni Backend API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  })
})

app.get("/", (c) => {
  return c.json({
    name: "Thakirni API",
    version: "1.0.0",
    docs: "/health",
    routes: [
      "POST   /api/meetings/upload",
      "GET    /api/meetings",
      "GET    /api/goals",
      "POST   /api/goals",
      "GET    /api/habits",
      "POST   /api/habits",
      "POST   /api/habits/:id/complete",
      "POST   /api/focus/start",
      "PATCH  /api/focus/:id/complete",
      "GET    /api/focus/stats",
      "POST   /api/documents/summarize",
      "GET    /api/subscriptions/me",
      "GET    /api/subscriptions/plans",
      "POST   /api/webhooks/paddle",
    ],
  })
})

// ── 404 ───────────────────────────────────────────────────────────────────────

app.notFound((c) => c.json({ error: "Route not found" }, 404))
app.onError((err, c) => {
  console.error("[API Error]", err.message)
  return c.json({ error: err.message ?? "Internal server error" }, 500)
})

// ── Start server ──────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "3001")

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`\n🚀 Thakirni Backend API running on http://localhost:${info.port}`)
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL ?? "http://localhost:3000"}`)
  console.log(`   Environment: ${process.env.NODE_ENV ?? "development"}\n`)
})

export default app
