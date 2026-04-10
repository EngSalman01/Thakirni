"use client"

import { MotionConfig } from "framer-motion"

/**
 * Sets global Framer Motion defaults. In v12, MotionConfig supports
 * `transition` but not `transformTemplate`, so GPU compositing is
 * handled via the `will-change` CSS rules in globals.css instead.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="never" transition={{ ease: [0.22, 1, 0.36, 1] as const }}>
      {children}
    </MotionConfig>
  )
}
