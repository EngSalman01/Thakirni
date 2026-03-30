import * as Sentry from "@sentry/nextjs"
import posthog from "posthog-js";

// Required for Sentry to capture navigation transitions in Next.js App Router
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2026-01-30",
});
