"use client"

import { MotionConfig } from "framer-motion"

/**
 * Forces GPU compositing on all Framer Motion elements by appending
 * translateZ(0) to every generated transform string. This promotes
 * animated elements to their own compositing layer, enabling sub-pixel
 * rendering and eliminating the "pixel-by-pixel" stepping effect.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      transformTemplate={(_, generated) => `${generated} translateZ(0px)`}
    >
      {children}
    </MotionConfig>
  )
}
