"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  width?: number
  height?: number
  variant?: "full" | "icon"
}

export function BrandLogo({ className, width = 40, height = 40, variant = "icon" }: BrandLogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Maps variants to the files provided by the user
  // variant="full" -> Logo with letters
  // variant="icon" -> Logo without letters (icon)
  const src = variant === "full" 
    ? "/images/logo-full.png"
    : "/images/logo-icon.png"

  return (
    <div className={cn("relative", className)}>
      <Image 
        src={src}
        alt="Thakirni Logo" 
        width={width} 
        height={height} 
        className="object-contain" // Ensures image fits within dimensions without distortion
        priority
      />
    </div>
  )
}
