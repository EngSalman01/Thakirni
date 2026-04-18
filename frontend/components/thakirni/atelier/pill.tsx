"use client"

/**
 * Pill — the signature Obsidian Assembly nav + badge primitive.
 *
 * Three visual flavors:
 *   - solid     → filled parchment chip (active state, primary CTA)
 *   - outline   → hairline border pill (default nav, secondary CTA)
 *   - ghost     → no border, just tracked label (tertiary link)
 *
 * All three share the same pill radius, heavy tracking, and uppercase body.
 * Tuck this into atelier nav rows, hero-adjacent CTAs, admission prompts,
 * testimonial tags, and footer capsules.
 */

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type PillVariant = "solid" | "outline" | "ghost"
type PillSize = "sm" | "md" | "lg"

type PillBaseProps = {
  variant?: PillVariant
  size?: PillSize
  className?: string
  children: React.ReactNode
  /** Optional leading slot — tiny icon or numeral. */
  leading?: React.ReactNode
  /** Optional trailing slot — arrow, counter, chevron. */
  trailing?: React.ReactNode
}

type PillAsButton = PillBaseProps & {
  as?: "button"
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof PillBaseProps>

type PillAsLink = PillBaseProps & {
  as: "link"
  href: string
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof PillBaseProps>

export type PillProps = PillAsButton | PillAsLink

const sizeMap: Record<PillSize, string> = {
  sm: "px-3 py-1 text-[0.6875rem]",
  md: "px-4 py-1.5 text-[0.75rem]",
  lg: "px-5 py-2 text-[0.8125rem]",
}

const variantMap: Record<PillVariant, string> = {
  // Filled parchment on obsidian — "enter" CTAs, active route.
  solid:
    "bg-[var(--c-parchment)] text-[var(--c-obsidian)] hover:bg-[var(--c-ivory)] " +
    "shadow-[0_0_0_0_transparent] hover:shadow-[0_8px_30px_-8px_var(--c-ember-glow)]",
  // Hairline ring — default nav pill.
  outline:
    "bg-transparent text-[var(--atelier-text)] " +
    "border border-[var(--atelier-border-strong)] " +
    "hover:border-[var(--c-parchment)] hover:text-[var(--c-parchment)]",
  // No border — inline caption links.
  ghost:
    "bg-transparent text-[var(--atelier-text-muted)] " +
    "hover:text-[var(--c-parchment)]",
}

const base =
  "inline-flex items-center justify-center gap-2 " +
  "rounded-full font-medium uppercase select-none " +
  "tracking-[var(--atelier-tracking-pill)] " +
  "transition-[color,background-color,border-color,box-shadow,transform] " +
  "duration-[var(--atelier-dur-2)] ease-[var(--atelier-ease-editorial)] " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[var(--c-ember)] focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-[var(--atelier-bg)] " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "whitespace-nowrap"

export function Pill(props: PillProps) {
  const {
    variant = "outline",
    size = "md",
    className,
    children,
    leading,
    trailing,
  } = props

  const content = (
    <>
      {leading && <span className="flex h-3 w-3 items-center justify-center">{leading}</span>}
      <span>{children}</span>
      {trailing && <span className="flex h-3 w-3 items-center justify-center">{trailing}</span>}
    </>
  )

  const classes = cn(base, sizeMap[size], variantMap[variant], className)

  if (props.as === "link") {
    const { as: _as, href, variant: _v, size: _s, leading: _l, trailing: _t, className: _c, children: _ch, ...rest } = props
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    )
  }

  const { as: _as, variant: _v, size: _s, leading: _l, trailing: _t, className: _c, children: _ch, ...rest } = props as PillAsButton
  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  )
}

/**
 * PillRow — horizontal flex-wrap row with the standard atelier gap.
 * Used under hero copy and as the primary top-nav container.
 */
export function PillRow({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
    </div>
  )
}
