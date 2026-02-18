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
  // Consistent sizing based on size prop
  const sizeConfig = {
    sm: { width: 40, height: 40 },
    md: { width: 80, height: 80 },
    lg: { width: 120, height: 120 }
  }

  const config = sizeConfig[size]
  const src = "/images/logo-full.png"

  return (
    <div className={cn("relative inline-flex items-center justify-center flex-shrink-0", className)}>
      <Image 
        src={src}
        alt="Thakirni Logo" 
        width={config.width}
        height={config.height}
        style={{ width: "auto", height: "auto" }}
        className="object-contain"
        priority
      />
    </div>
  )
}
