"use client";

import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export function LanguageToggle() {
  const { isArabic, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(isArabic ? "en" : "ar");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2 text-foreground/70 hover:text-foreground"
    >
      <Languages className="h-4 w-4" />
      <span className="text-sm font-medium">{isArabic ? "EN" : "عربي"}</span>
    </Button>
  );
}
