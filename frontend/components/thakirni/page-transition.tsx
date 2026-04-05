"use client"

import { motion } from "framer-motion"
import { type ReactNode } from "react"

/**
 * PageTransition
 *
 * Wraps any page/view in a GPU-safe fade+slide entrance.
 * Uses only opacity + translateY — both composited on GPU.
 *
 * Timing standard:
 *   - duration: 0.2s (fast enough to feel instant, slow enough to be smooth)
 *   - easing: [0.22, 1, 0.36, 1] (ease-out-expo — snappy start, smooth settle)
 */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * FadeIn
 *
 * Simpler opacity-only entrance — for content that shouldn't move.
 */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * SlideUp
 *
 * Standard card/section entrance — translateY + opacity, GPU-safe.
 */
export function SlideUp({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Standard Framer Motion timing presets — import and reuse these.
 *
 * Rule: NEVER use random durations. Use one of these.
 */
export const TRANSITION = {
  /** 0.15s — micro-interactions, button taps */
  fast:   { duration: 0.15, ease: [0.22, 1, 0.36, 1] as const },
  /** 0.2s  — standard page entrance, card reveals */
  std:    { duration: 0.2,  ease: [0.22, 1, 0.36, 1] as const },
  /** 0.25s — smooth section transitions */
  smooth: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  /** Spring — for layout animations (tabs, toggles, indicators) */
  spring: { type: "spring" as const, stiffness: 400, damping: 35, mass: 0.8 },
} as const

/**
 * Standard whileHover / whileTap presets.
 */
export const HOVER = {
  lift:    { y: -4, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
  liftSm:  { y: -2, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
  scale:   { scale: 1.03, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } },
  scaleSm: { scale: 1.015, transition: { duration: 0.15 } },
} as const

export const TAP = {
  press:    { scale: 0.96 },
  pressSm:  { scale: 0.98 },
} as const
