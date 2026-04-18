"use client"

/**
 * OrbitSvg — the ambient decorative element used in OA's hero and section gaps.
 *
 * Renders a set of concentric rings with tiny ember satellites. Three presets:
 *   - "quiet"   → three thin rings, no spin
 *   - "ambient" → four rings, slow rotation, single satellite
 *   - "active"  → five rings, medium rotation, three satellites
 *
 * Always purely decorative, so it sets aria-hidden and pointer-events-none.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export type OrbitSvgProps = {
  preset?: "quiet" | "ambient" | "active"
  /** Overall box size in px. Scales both width + height. */
  size?: number
  /** Defaults to a subtle ember. Pass any CSS color. */
  stroke?: string
  className?: string
}

type RingSpec = { r: number; opacity: number; dash?: string }
type SatelliteSpec = { angle: number; radius: number; size: number; color: string }

const PRESETS: Record<
  NonNullable<OrbitSvgProps["preset"]>,
  { rings: RingSpec[]; satellites: SatelliteSpec[]; spin: boolean }
> = {
  quiet: {
    rings: [
      { r: 120, opacity: 0.5 },
      { r: 180, opacity: 0.3 },
      { r: 240, opacity: 0.15 },
    ],
    satellites: [],
    spin: false,
  },
  ambient: {
    rings: [
      { r: 100, opacity: 0.55 },
      { r: 155, opacity: 0.38 },
      { r: 210, opacity: 0.22 },
      { r: 265, opacity: 0.12, dash: "2 8" },
    ],
    satellites: [{ angle: 32, radius: 155, size: 4, color: "var(--c-ember)" }],
    spin: true,
  },
  active: {
    rings: [
      { r: 80, opacity: 0.6 },
      { r: 130, opacity: 0.45 },
      { r: 180, opacity: 0.3 },
      { r: 230, opacity: 0.18 },
      { r: 280, opacity: 0.08, dash: "1 6" },
    ],
    satellites: [
      { angle: 0, radius: 130, size: 5, color: "var(--c-ember)" },
      { angle: 120, radius: 180, size: 3, color: "var(--c-sage)" },
      { angle: 240, radius: 80, size: 3, color: "var(--c-parchment)" },
    ],
    spin: true,
  },
}

export function OrbitSvg({
  preset = "ambient",
  size = 600,
  stroke = "var(--c-parchment)",
  className,
}: OrbitSvgProps) {
  const spec = PRESETS[preset]

  // Satellite coordinates — precomputed at this angle; CSS rotation handles motion.
  const satellitePoints = spec.satellites.map((s) => {
    const rad = (s.angle * Math.PI) / 180
    return {
      cx: 300 + s.radius * Math.cos(rad),
      cy: 300 + s.radius * Math.sin(rad),
      r: s.size,
      color: s.color,
    }
  })

  return (
    <svg
      aria-hidden
      viewBox="0 0 600 600"
      width={size}
      height={size}
      className={cn("pointer-events-none select-none", className)}
    >
      <g className={spec.spin ? "atelier-orbit-spin" : ""} style={{ transformOrigin: "300px 300px" }}>
        {spec.rings.map((ring, i) => (
          <circle
            key={i}
            cx={300}
            cy={300}
            r={ring.r}
            fill="none"
            stroke={stroke}
            strokeOpacity={ring.opacity}
            strokeWidth={0.75}
            strokeDasharray={ring.dash}
          />
        ))}

        {satellitePoints.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.cx}
              cy={p.cy}
              r={p.r * 3}
              fill={p.color}
              fillOpacity={0.18}
              filter="blur(6px)"
            />
            <circle cx={p.cx} cy={p.cy} r={p.r} fill={p.color} />
          </g>
        ))}
      </g>

      {/* Central glyph — a tiny ember dot to mark the "self" in the brain. */}
      <circle cx={300} cy={300} r={3} fill="var(--c-ember)" />
      <circle
        cx={300}
        cy={300}
        r={10}
        fill="var(--c-ember)"
        fillOpacity={0.15}
        className="atelier-glow-pulse"
      />
    </svg>
  )
}
