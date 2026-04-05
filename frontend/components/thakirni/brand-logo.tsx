"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export interface BrandLogoProps {
  className?: string
  /**
   * "full"  → always show icon + wordmark (horizontal)
   * "icon"  → always show squircle icon only
   * "auto"  → icon-only on mobile (<md), full on md+
   */
  variant?: "full" | "icon" | "auto"
}

export function BrandLogo({ className, variant = "auto" }: BrandLogoProps) {
  const { resolvedTheme } = useTheme()
  // resolvedTheme is undefined on first render (SSR) — default to light
  const isDark = (resolvedTheme ?? "light") === "dark"
  const fullSrc = isDark ? "/images/logo-dark.svg" : "/images/logo-light.svg"
  const iconSrc = "/images/icon-96.svg"

  if (variant === "icon") {
    return (
      <Image
        src={iconSrc}
        alt="Thakirni"
        width={36}
        height={36}
        priority
        unoptimized
        className={cn("object-contain shrink-0", className)}
      />
    )
  }

  if (variant === "full") {
    return (
      <Image
        src={fullSrc}
        alt="Thakirni"
        width={180}
        height={40}
        priority
        unoptimized
        className={cn("object-contain w-auto", className)}
      />
    )
  }

  // auto: icon-only on mobile, full logo on md+
  // Both images are SVGs (<4 KB each) — rendering both is negligible.
  return (
    <span className="inline-flex items-center shrink-0">
      {/* Mobile: squircle icon only */}
      <Image
        src={iconSrc}
        alt="Thakirni"
        width={32}
        height={32}
        priority
        unoptimized
        className={cn("object-contain block md:hidden", className)}
      />
      {/* Tablet+: full horizontal logo */}
      <Image
        src={fullSrc}
        alt="Thakirni"
        width={160}
        height={36}
        priority
        unoptimized
        className={cn("object-contain w-auto hidden md:block", className)}
      />
    </span>
  )
}
