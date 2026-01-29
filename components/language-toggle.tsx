"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"

export function LanguageToggle() {
  const [isArabic, setIsArabic] = useState(true)

  useEffect(() => {
    const html = document.documentElement
    if (isArabic) {
      html.setAttribute("dir", "rtl")
      html.setAttribute("lang", "ar")
    } else {
      html.setAttribute("dir", "ltr")
      html.setAttribute("lang", "en")
    }
  }, [isArabic])

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsArabic(!isArabic)}
      className="gap-2 text-foreground/70 hover:text-foreground"
    >
      <Languages className="h-4 w-4" />
      <span className="text-sm font-medium">
        {isArabic ? "EN" : "عربي"}
      </span>
    </Button>
  )
}
