"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "full" | "icon"
}

export function BrandLogo({ 
  className, 
  size = "md",
  variant = "full"
}: BrandLogoProps) {
  // Fixed square dimensions for brain icon logo
  const sizeConfig = {
    sm: 32,    // 32px
    md: 64,    // 64px
    lg: 96     // 96px
  }

  const dimension = sizeConfig[size]
  const src = "/images/logo-full.png"

  return (
    <div 
      className={cn("relative inline-flex items-center justify-center flex-shrink-0", className)}
      style={{ width: dimension, height: dimension }}
    >
      <Image 
        src={src}
        alt="Thakirni Logo" 
        width={dimension}
        height={dimension}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  )
}
