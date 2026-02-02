"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  width?: number
  height?: number
  showText?: boolean
}

export function BrandLogo({ className, width = 40, height = 40 }: BrandLogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Default to logo-dark (for light background) if not mounted or theme is light
  const src = !mounted 
    ? "/images/logo-dark.png" 
    : resolvedTheme === "dark" 
      ? "/images/logo-light.png" 
      : "/images/logo-dark.png"

  return (
    <div className={cn("relative", className)}>
      <Image 
        src={src}
        alt="Thakirni Logo" 
        width={width} 
        height={height} 
        className="object-contain" // object-contain ensures the whole logo is visible
        priority
      />
    </div>
  )
}
