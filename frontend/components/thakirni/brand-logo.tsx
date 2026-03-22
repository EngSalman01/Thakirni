"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  const { resolvedTheme } = useTheme()
  // resolvedTheme is undefined on first render (SSR) — default to light
  const src =
    (resolvedTheme ?? "light") === "dark"
      ? "/images/logo-dark.svg"
      : "/images/logo-light.svg"

  return (
    <Image
      src={src}
      alt="Thakirni"
      width={180}
      height={40}
      priority
      unoptimized
      className={cn("object-contain", className)}
    />
  )
}
