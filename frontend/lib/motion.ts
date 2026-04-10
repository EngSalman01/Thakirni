/**
 * Thakirni Motion Identity System
 * ─────────────────────────────────
 * "Soft intelligence with a spark"
 *
 * Every animation in the product should use these tokens.
 * No ad-hoc durations or custom easings — everything comes from here.
 */

import type { Transition, Variants, TargetAndTransition } from "framer-motion"

// ── Easing curves ─────────────────────────────────────────────────────────────

export const ease = {
  /** Primary brand ease — ease-out-expo. Fast start, smooth settle. */
  primary:  [0.22, 1, 0.36, 1] as const,
  /** Slightly softer — for cards and modals */
  smooth:   [0.16, 1, 0.3, 1] as const,
  /** Exit ease — ease-in for things leaving */
  exit:     [0.4, 0, 1, 1] as const,
} as const

export const spring = {
  /** Standard UI spring — tabs, indicators, toggles */
  standard: { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.8 },
  /** Bouncy — for success pops and confirmation */
  pop:      { type: "spring" as const, stiffness: 380, damping: 22, mass: 0.7 },
  /** Gentle — for breathing and subtle movement */
  gentle:   { type: "spring" as const, stiffness: 200, damping: 28, mass: 1.0 },
} as const

// ── Duration scale ────────────────────────────────────────────────────────────

export const duration = {
  micro:  0.12,   // button press feedback
  fast:   0.18,   // hover states
  normal: 0.22,   // spark, confirmation pop
  page:   0.28,   // page transitions, modals
  breath: 2.6,    // breathing idle loop
  voice:  1.2,    // voice pulse loop
} as const

// ── Consolidated token object (for components that import everything) ─────────

export const motionTokens = { ease, spring, duration } as const

// ─────────────────────────────────────────────────────────────────────────────
// SIGNATURE ANIMATIONS
// Five named brand effects. Use these — don't invent new ones.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A. SPARK RESPONSE — Thakirni's #1 identity effect.
 * Fires on: task complete, AI response, save success.
 * scale up → settle + glow pulse.
 */
export const sparkTransition: Transition = {
  duration: duration.normal,
  ease: ease.primary,
}
export const sparkAnimate: TargetAndTransition = {
  scale: [1, 1.08, 0.97, 1],
}

/**
 * B. BREATHING IDLE — Living presence for logo and empty states.
 * Uses opacity-only pulse — opacity is sub-pixel (floating-point multiplier,
 * no pixel grid), so it is guaranteed smooth at any screen DPI without
 * needing GPU compositing tricks. Scale-based breathing (≤5% change) has
 * only 0–2 visible integer-pixel positions on small elements, producing the
 * "pixel-by-pixel stepping" effect regardless of compositor layer status.
 */
export const breathingInitial: TargetAndTransition = {
  opacity: 0.68,
}
export const breathingAnimate: TargetAndTransition = {
  opacity: 1,
}
export const breathingTransition: Transition = {
  duration: duration.breath,   // 2.6 s
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
}

/**
 * C. INTELLIGENT SLIDE — Page + card entrance.
 * Content "settles" into place — never jumps.
 */
export const intelligentSlideVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.page, ease: ease.primary },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: duration.fast, ease: ease.exit },
  },
}

/**
 * D. CONFIRMATION POP — Checkmarks, habit toggles, saves.
 * Tiny overshoot → satisfying "done" feeling.
 */
export const confirmPopVariants: Variants = {
  idle: { scale: 1 },
  pop: {
    scale: [1, 0.88, 1.14, 1],
    transition: { duration: duration.normal + 0.04, ease: ease.smooth },
  },
}

/**
 * E. VOICE PULSE — Mic button while recording.
 * Scale + gentle rock = alive assistant.
 */
export const voicePulseAnimate: TargetAndTransition = {
  scale:  [1, 1.09, 0.96, 1.09, 1],
  rotate: [0, 1.5, -1.5, 1.5, 0],
}
export const voicePulseTransition: Transition = {
  duration: duration.voice,
  repeat: Infinity,
  ease: "easeInOut",
}

/**
 * ERROR SHAKE — Small x-axis shake for error feedback.
 * Replaces red borders as the first signal something failed.
 */
export const errorShakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [-4, 4, -3, 3, -1, 0],
    transition: { duration: 0.4, ease: ease.smooth },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION PRESETS (whileHover / whileTap)
// ─────────────────────────────────────────────────────────────────────────────

export const hover = {
  /** Standard card lift */
  lift:    { y: -3, transition: { duration: duration.fast, ease: ease.primary } },
  /** Subtle scale — for icons and small targets */
  scale:   { scale: 1.04, transition: { duration: duration.fast, ease: ease.primary } },
  /** Minimal — for list items */
  dim:     { opacity: 0.85 },
  /** Button glow — scale + brighten */
  button:  { scale: 1.02, transition: { duration: duration.fast, ease: ease.primary } },
} as const

export const tap = {
  press:    { scale: 0.96 },
  pressSm:  { scale: 0.97 },
  pressXs:  { scale: 0.98 },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// PAGE / LIST STAGGER PRESETS
// ─────────────────────────────────────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: ease.primary } },
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITION SHORTHANDS (drop-in for transition prop)
// ─────────────────────────────────────────────────────────────────────────────

export const t = {
  micro:  { duration: duration.micro,  ease: ease.primary } as const,
  fast:   { duration: duration.fast,   ease: ease.primary } as const,
  normal: { duration: duration.normal, ease: ease.primary } as const,
  page:   { duration: duration.page,   ease: ease.smooth  } as const,
  spring: spring.standard,
  pop:    spring.pop,
} as const
