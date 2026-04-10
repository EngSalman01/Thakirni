"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import type { ReactNode } from "react"

interface AnimatedSectionProps extends Omit<HTMLMotionProps<"div">, "transition"> {
  children: ReactNode
  delay?: number
  // Accept any transition shape — framer-motion v12 tuple types don't match inferred number[]
  transition?: Record<string, unknown>
}

export function AnimatedSection({ children, className, delay = 0, ...props }: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
