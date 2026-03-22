"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  const { resolvedTheme } = useTheme()
  const src =
    resolvedTheme === "dark"
      ? "/images/logo-dark.svg"
      : "/images/logo-light.svg"

  return (
    <Image
      src={src}
      alt="Thakirni"
      width={180}
      height={40}
      priority
      className={cn("object-contain", className)}
    />
  )
}
