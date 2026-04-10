"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { motion, type Transition, type TargetAndTransition } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  breathingInitial, breathingAnimate, breathingTransition,
  sparkAnimate, sparkTransition,
  voicePulseAnimate, voicePulseTransition,
  ease, duration,
} from "@/lib/motion"

// ── Animation presets ──────────────────────────────────────────────────────────

/**
 * idle     → soft breathing glow (default, loops)
 * action   → task completion burst (plays once)
 * voice    → pulse + wiggle while recording (loops)
 * thinking → shimmer opacity pulse while AI processes (loops)
 */
export type LogoState = "idle" | "action" | "voice" | "thinking"

const ANIM: Record<LogoState, {
  animate: TargetAndTransition
  transition: Transition
}> = {
  idle: {
    animate: breathingAnimate,
    transition: breathingTransition,
  },
  action: {
    animate: sparkAnimate,
    transition: sparkTransition,
  },
  voice: {
    animate: voicePulseAnimate,
    transition: voicePulseTransition,
  },
  thinking: {
    animate: { opacity: [1, 0.5, 1] },
    transition: { duration: duration.voice, repeat: Infinity, ease: "easeInOut" },
  },
}

// ── Props ──────────────────────────────────────────────────────────────────────

export interface BrandLogoProps {
  className?: string
  /**
   * "full"  → always show icon + wordmark (horizontal)
   * "icon"  → always show squircle icon only
   * "auto"  → icon-only on mobile (<md), full on md+
   */
  variant?: "full" | "icon" | "auto"
  /** Animation mode applied to the icon. Defaults to "idle". */
  state?: LogoState
  /** Set false to suppress all animation (e.g., in print / reduced-motion). */
  animate?: boolean
  /** Override icon size in px (width = height). */
  iconSize?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BrandLogo({
  className,
  variant = "auto",
  state = "idle",
  animate = true,
  iconSize,
}: BrandLogoProps) {
  const { resolvedTheme } = useTheme()
  const isDark = (resolvedTheme ?? "light") === "dark"

  const fullSrc = isDark ? "/logo-full-dark.svg" : "/logo-full.svg"
  const iconSrc = "/logo-icon.svg"

  const { animate: animValues, transition } = ANIM[state]

  // ── Sub-elements ─────────────────────────────────────────────────────────────

  function AnimatedIcon({ size = 36 }: { size?: number }) {
    return (
      <motion.span
        className="inline-flex shrink-0 select-none"
        initial={animate ? breathingInitial : undefined}
        animate={animate ? animValues : undefined}
        transition={animate ? transition : undefined}
        style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
      >
        <Image
          src={iconSrc}
          alt="Thakirni"
          width={size}
          height={size}
          priority
          unoptimized
          draggable={false}
          className="object-contain block rounded-[25%]"
          style={{ width: size, height: size }}
        />
      </motion.span>
    )
  }

  function FullLogo({ h = 36 }: { h?: number }) {
    // Maintain the 196×56 SVG aspect ratio
    const w = Math.round(h * (196 / 56))
    return (
      <Image
        src={fullSrc}
        alt="Thakirni"
        width={w}
        height={h}
        priority
        unoptimized
        draggable={false}
        className="object-contain block w-auto"
        style={{ height: h }}
      />
    )
  }

  // ── Variants ─────────────────────────────────────────────────────────────────

  if (variant === "icon") {
    return (
      <span className={cn("inline-flex items-center shrink-0", className)}>
        <AnimatedIcon size={iconSize ?? 36} />
      </span>
    )
  }

  if (variant === "full") {
    return (
      <span className={cn("inline-flex items-center shrink-0", className)}>
        <FullLogo h={iconSize ?? 36} />
      </span>
    )
  }

  // auto — icon on mobile, full logo on md+
  // Both SVGs are <4 KB — rendering both causes no perceptible overhead.
  return (
    <span className={cn("inline-flex items-center shrink-0", className)}>
      {/* Mobile: animated icon only */}
      <span className="md:hidden">
        <AnimatedIcon size={iconSize ?? 30} />
      </span>
      {/* Tablet/Desktop: full horizontal logo (no per-icon animation — whole logo subtly breathes) */}
      <motion.span
        className="hidden md:inline-flex"
        initial={animate ? breathingInitial : undefined}
        animate={animate ? animValues : undefined}
        transition={animate ? transition : undefined}
        style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
      >
        <FullLogo h={iconSize ?? 36} />
      </motion.span>
    </span>
  )
}
