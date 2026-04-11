"use client"

import { motion } from "framer-motion"
import { type ReactNode } from "react"
import { ease, duration, spring, hover, tap } from "@/lib/motion"

/**
 * PageTransition
 *
 * Wraps any page/view in a GPU-safe fade+slide entrance.
 * Uses only opacity + translateY — both composited on GPU.
 */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: duration.page, ease: ease.primary }}
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
      transition={{ duration: duration.page, ease: "easeOut", delay }}
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
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0 }}
      transition={{ duration: duration.page, ease: ease.primary, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Standard Framer Motion timing presets — import and reuse these.
 * Prefer importing directly from @/lib/motion for new code.
 */
export const TRANSITION = {
  fast:   { duration: duration.fast,   ease: ease.primary } as const,
  std:    { duration: duration.page,   ease: ease.primary } as const,
  smooth: { duration: duration.page,   ease: ease.smooth  } as const,
  spring: spring.standard,
} as const

export const HOVER = {
  lift:    hover.lift,
  liftSm:  { y: -2, transition: { duration: duration.fast, ease: ease.primary } },
  scale:   hover.scale,
  scaleSm: { scale: 1.015, transition: { duration: duration.fast } },
} as const

export const TAP = {
  press:   tap.press,
  pressSm: tap.pressSm,
} as const
