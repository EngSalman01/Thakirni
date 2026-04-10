"use client"

/**
 * Thakirni Motion Primitives
 * ───────────────────────────
 * Five signature animations + emotional feedback system.
 * Import these instead of writing raw Framer Motion everywhere.
 */

import { useCallback, useRef, useState, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  sparkAnimate, sparkTransition,
  breathingInitial, breathingAnimate, breathingTransition,
  intelligentSlideVariants,
  confirmPopVariants,
  voicePulseAnimate, voicePulseTransition,
  errorShakeVariants,
  staggerContainer, staggerItem,
  hover, tap,
  t as tt,
} from "@/lib/motion"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// A. SPARK RESPONSE — Thakirni's primary brand identity effect
// ─────────────────────────────────────────────────────────────────────────────

interface SparkWrapperProps {
  children: ReactNode
  className?: string
  /** When true, plays the spark animation once */
  active?: boolean
}

/**
 * Wrap any element. When `active` flips to true, plays the spark once.
 * Use for: task saves, habit completions, AI responses landing.
 */
export function SparkWrapper({ children, className, active = false }: SparkWrapperProps) {
  return (
    <motion.div
      className={cn("relative inline-flex", className)}
      animate={active ? sparkAnimate : { scale: 1 }}
      transition={sparkTransition}
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    >
      {children}
      {/* Radial glow burst — only visible during spark */}
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        animate={active
          ? { opacity: [0, 0.35, 0], scale: [0.8, 1.4, 1.8] }
          : { opacity: 0 }
        }
        transition={{ duration: 0.38, ease: [0.2, 1, 0.3, 1] }}
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.45) 0%, transparent 70%)",
          willChange: "transform, opacity",
        }}
      />
    </motion.div>
  )
}

/**
 * Hook: returns a `trigger()` fn — call it to fire a spark once.
 * Returns `isSparking` so you can pass to SparkWrapper.active.
 *
 * ```tsx
 * const { trigger, isSparking } = useSparkTrigger()
 * <SparkWrapper active={isSparking}>
 *   <button onClick={() => { save(); trigger() }}>Save</button>
 * </SparkWrapper>
 * ```
 */
export function useSparkTrigger(durationMs = 280) {
  const [isSparking, setIsSparking] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trigger = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsSparking(true)
    timerRef.current = setTimeout(() => setIsSparking(false), durationMs)
  }, [durationMs])

  return { trigger, isSparking }
}

// ─────────────────────────────────────────────────────────────────────────────
// B. BREATHING IDLE — Logo presence, empty states, AI thinking
// ─────────────────────────────────────────────────────────────────────────────

interface BreathingPresenceProps {
  children: ReactNode
  className?: string
  /** Set false to pause (e.g. when something is actively happening) */
  active?: boolean
}

export function BreathingPresence({ children, className, active = true }: BreathingPresenceProps) {
  return (
    <motion.div
      className={cn("inline-flex", className)}
      initial={breathingInitial}
      animate={active ? breathingAnimate : { opacity: 1 }}
      transition={active ? breathingTransition : { duration: tt.normal.duration }}
      style={{ willChange: "opacity" }}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// C. INTELLIGENT SLIDE — Page + card entrance (replaces harsh jumps)
// ─────────────────────────────────────────────────────────────────────────────

interface IntelligentSlideProps {
  children: ReactNode
  className?: string
  delay?: number
  /** Use "visible" variant name for whileInView patterns */
  inView?: boolean
}

export function IntelligentSlide({ children, className, delay = 0, inView = false }: IntelligentSlideProps) {
  if (inView) {
    return (
      <motion.div
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-32px" }}
        variants={{
          hidden: intelligentSlideVariants.hidden,
          visible: {
            ...intelligentSlideVariants.visible,
            transition: {
              ...(intelligentSlideVariants.visible as { transition?: object }).transition,
              delay,
            },
          },
        }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={intelligentSlideVariants}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// D. CONFIRMATION POP — Habit toggles, checkmarks, saves
// ─────────────────────────────────────────────────────────────────────────────

interface ConfirmationPopProps {
  children: ReactNode
  className?: string
  /** Trigger the pop by toggling this key — any change fires the animation */
  triggerKey?: string | number | boolean
}

export function ConfirmationPop({ children, className, triggerKey }: ConfirmationPopProps) {
  const [anim, setAnim] = useState<"idle" | "pop">("idle")
  const prevKey = useRef(triggerKey)

  if (prevKey.current !== triggerKey) {
    prevKey.current = triggerKey
    // Schedule state update outside render to avoid React warnings
    setTimeout(() => {
      setAnim("pop")
      setTimeout(() => setAnim("idle"), 300)
    }, 0)
  }

  return (
    <motion.div
      className={cn("inline-flex", className)}
      variants={confirmPopVariants}
      animate={anim}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// E. VOICE PULSE — Mic button while recording
// ─────────────────────────────────────────────────────────────────────────────

interface VoicePulseProps {
  children: ReactNode
  className?: string
  /** Whether the voice recording is active */
  recording?: boolean
}

export function VoicePulse({ children, className, recording = false }: VoicePulseProps) {
  return (
    <motion.div
      className={cn("relative inline-flex items-center justify-center", className)}
      initial={{ scale: 1, rotate: 0 }}
      animate={recording ? voicePulseAnimate : { scale: 1, rotate: 0 }}
      transition={recording ? voicePulseTransition : { duration: tt.fast.duration }}
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    >
      {/* Ripple ring visible during recording */}
      <AnimatePresence>
        {recording && (
          <motion.span
            key="ripple"
            className="absolute inset-0 rounded-full border-2 border-emerald-400/60"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
            style={{ willChange: "transform, opacity" }}
          />
        )}
      </AnimatePresence>
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMOTIONAL FEEDBACK — Error shake
// ─────────────────────────────────────────────────────────────────────────────

interface ShakeErrorProps {
  children: ReactNode
  className?: string
  /** Flipping this triggers one shake */
  shake?: boolean
}

export function ShakeError({ children, className, shake = false }: ShakeErrorProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={errorShakeVariants}
      animate={shake ? "shake" : "idle"}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGGER LIST — Animated list where children enter in sequence
// ─────────────────────────────────────────────────────────────────────────────

interface StaggerListProps {
  children: ReactNode
  className?: string
}

export function StaggerList({ children, className }: StaggerListProps) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={staggerItem}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MOTION CARD — Standard card with hover lift + tap press
// ─────────────────────────────────────────────────────────────────────────────

interface MotionCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function MotionCard({ children, className, onClick, disabled }: MotionCardProps) {
  return (
    <motion.div
      className={cn("cursor-pointer", disabled && "pointer-events-none", className)}
      whileHover={!disabled ? hover.lift : undefined}
      whileTap={!disabled ? tap.press : undefined}
      onClick={onClick}
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// THAKIRNI BUTTON — Primary CTA with spark on click
// ─────────────────────────────────────────────────────────────────────────────

interface ThakirniButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragEnd" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDragStart" | "onDrop" | "onAnimationStart"> {
  children: ReactNode
  className?: string
  /** Fire spark effect after click — use for save/submit actions */
  withSpark?: boolean
}

export function ThakirniButton({ children, className, withSpark = true, onClick, ...props }: ThakirniButtonProps) {
  const { trigger, isSparking } = useSparkTrigger()

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (withSpark) trigger()
    onClick?.(e)
  }, [withSpark, trigger, onClick])

  return (
    <SparkWrapper active={isSparking} className="inline-flex w-full sm:w-auto">
      <motion.button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5",
          "power-gradient text-white font-bold text-sm shadow-lg",
          "disabled:opacity-60 disabled:pointer-events-none",
          className,
        )}
        whileHover={hover.button}
        whileTap={tap.press}
        onClick={handleClick}
        style={{ willChange: "transform", transform: "translateZ(0)" }}
        {...props}
      >
        {children}
      </motion.button>
    </SparkWrapper>
  )
}

// Re-export tokens for convenience
export { hover, tap } from "@/lib/motion"
