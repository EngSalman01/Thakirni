"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  width?: number
  height?: number
  // Variant prop is kept for backward compatibility but ignored or mapped to same file
  variant?: "full" | "icon"
}

export function BrandLogo({ className, width = 120, height = 40 }: BrandLogoProps) {
  // Using the single logo file provided by user (logo-full.png)
  const src = "/images/logo-full.png"

  return (
    <div className={cn("relative", className)}>
      <Image 
        src={src}
        alt="Thakirni Logo" 
        width={width} 
        height={height} 
        className="object-contain"
        priority
      />
    </div>
  )
}
