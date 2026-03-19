/**
 * Server layer index — re-exports all backend services.
 * Import from here in API routes and server actions.
 *
 * NEVER import this in client components ("use client").
 * Only import in server components, server actions, or API routes.
 */
import "server-only";

export * from "./services/memory.service";
export * from "./services/profile.service";
export * from "./services/team.service";
export * from "./services/ai.service";
export * from "./middleware/auth";
