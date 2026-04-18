"use client"

/**
 * NavPills — the top-of-page navigation row, in OA style.
 *
 * Sits under or above the WordmarkStacked. A row of outlined Pills where:
 *   - The active route is rendered with the "solid" variant (filled parchment)
 *   - Inactive routes use "outline"
 *   - A dedicated "Admission" / CTA pill is rendered last with a solid ember
 *     accent. Useful for "Request Access" / "Open Vault" primaries.
 *
 * Supports both top-nav and in-page anchor nav usage.
 */

import * as React from "react"
import { usePathname } from "next/navigation"
import { Pill, PillRow } from "./pill"
import { cn } from "@/lib/utils"

export type NavPillItem = {
  label: React.ReactNode
  href: string
  /** If set, takes precedence over pathname-matching. */
  active?: boolean
  /** Force this item to render as a CTA pill (solid / ember). */
  cta?: boolean
  /** External link. */
  external?: boolean
}

export type NavPillsProps = {
  items: NavPillItem[]
  className?: string
  size?: "sm" | "md" | "lg"
}

export function NavPills({ items, className, size = "md" }: NavPillsProps) {
  const pathname = usePathname()

  return (
    <PillRow className={cn("gap-2", className)}>
      {items.map((item, i) => {
        const isActive = item.active ?? pathname === item.href
        const variant = item.cta ? "solid" : isActive ? "solid" : "outline"

        return (
          <Pill
            key={i}
            as="link"
            href={item.href}
            size={size}
            variant={variant}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            className={cn(
              item.cta &&
                "bg-[var(--c-ember)] text-[var(--c-obsidian)] hover:bg-[var(--c-ember)] hover:text-[var(--c-obsidian)] hover:brightness-110",
            )}
            trailing={item.cta ? <span aria-hidden>→</span> : undefined}
          >
            {item.label}
          </Pill>
        )
      })}
    </PillRow>
  )
}
