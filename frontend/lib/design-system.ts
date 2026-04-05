/**
 * Thakirni Design System
 *
 * Centralized design tokens — single source of truth for the brand system.
 * These map to the CSS custom properties defined in app/globals.css.
 *
 * Usage: import { DS } from "@/lib/design-system"
 */

// ── Colors ─────────────────────────────────────────────────────────────────────

export const Colors = {
  // Brand primaries
  primary:   "#4F46E5",   // Indigo
  secondary: "#7C3AED",   // Violet
  accent:    "#EC4899",   // Pink

  // Dark backgrounds
  bgDark:     "#0B0F1A",
  surfaceDark: "#111827",
  borderDark:  "#1F2937",

  // Light backgrounds
  bgLight:     "#fafafa",
  surfaceLight: "#ffffff",
  borderLight:  "#e2e8f0",

  // Text
  textDark:  "#E5E7EB",
  textLight: "#0f172a",
  muted:     "#9CA3AF",

  // Semantic
  success: "#10b981",
  warning: "#f59e0b",
  error:   "#ef4444",
  whatsapp: "#25d366",
} as const

// ── Gradients ──────────────────────────────────────────────────────────────────

export const Gradients = {
  /** Primary brand gradient — Indigo → Violet → Pink */
  primary: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 40%, #EC4899 100%)",

  /** Subtle dark hero background */
  heroDark:
    "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(79,70,229,0.15), transparent), " +
    "radial-gradient(ellipse 60% 40% at 80% 60%, rgba(236,72,153,0.08), transparent)",

  /** Card glow accent */
  cardAccent: "linear-gradient(135deg, rgba(79,70,229,0.12) 0%, rgba(124,58,237,0.08) 100%)",

  /** Text gradient — apply via gradient-text class */
  text: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 40%, #EC4899 100%)",
} as const

// ── Spacing ────────────────────────────────────────────────────────────────────

export const Space = {
  xs:  "4px",
  sm:  "8px",
  md:  "16px",
  lg:  "24px",
  xl:  "32px",
  "2xl": "48px",
  "3xl": "64px",
  "4xl": "96px",
} as const

// ── Border Radius ──────────────────────────────────────────────────────────────

export const Radius = {
  sm:  "8px",
  md:  "12px",
  lg:  "16px",
  xl:  "24px",
  "2xl": "32px",
  full: "9999px",
} as const

// ── Shadows ────────────────────────────────────────────────────────────────────

export const Shadows = {
  soft:   "0 4px 20px rgba(0, 0, 0, 0.08)",
  card:   "0 8px 30px rgba(79, 70, 229, 0.10)",
  glow:   "0 0 40px rgba(124, 58, 237, 0.35)",
  btn:    "0 0 32px rgba(124, 58, 237, 0.45)",
  ambient:"0 4px 20px rgba(79, 70, 229, 0.08)",
} as const

// ── Typography ─────────────────────────────────────────────────────────────────

export const Typography = {
  fonts: {
    /** English — system sans */
    en: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    /** Arabic — humanist Arabic */
    ar: "'IBM Plex Arabic', Cairo, 'Segoe UI', Tahoma, Arial, sans-serif",
    /** Display / headline */
    headline: "'Plus Jakarta Sans', var(--font-en), system-ui, sans-serif",
  },
  scale: {
    hero:  { size: "clamp(2.5rem, 5vw, 3rem)",  weight: 800, lineHeight: 1.15 },
    h1:    { size: "2rem",   weight: 700, lineHeight: 1.25 },
    h2:    { size: "1.5rem", weight: 600, lineHeight: 1.3  },
    body:  { size: "1rem",   weight: 400, lineHeight: 1.6  },
    small: { size: "0.875rem", weight: 400, lineHeight: 1.5 },
    xs:    { size: "0.75rem",  weight: 400, lineHeight: 1.4 },
  },
} as const

// ── Animation ──────────────────────────────────────────────────────────────────

export const Motion = {
  /** Fast micro-interaction */
  fast:   { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const },
  /** Standard transition */
  std:    { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
  /** Smooth entrance */
  enter:  { duration: 0.5,  ease: [0.2, 1, 0.3, 1] as const },
  /** Expressive spring */
  spring: { type: "spring" as const, stiffness: 300, damping: 30 },

  /** Common whileHover / whileTap presets */
  hoverLift: { y: -4, scale: 1.02 },
  btnPress:  { scale: 0.96 },
} as const

// ── Breakpoints ────────────────────────────────────────────────────────────────

export const Breakpoints = {
  sm:  640,
  md:  768,
  lg:  1024,
  xl:  1280,
  "2xl": 1536,
} as const

// ── Combined export ────────────────────────────────────────────────────────────

export const DS = {
  colors:      Colors,
  gradients:   Gradients,
  space:       Space,
  radius:      Radius,
  shadows:     Shadows,
  typography:  Typography,
  motion:      Motion,
  breakpoints: Breakpoints,
} as const

export type DesignSystem = typeof DS
