"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Language = "ar" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isArabic: boolean;
  t: (ar: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default to Arabic
  const [language, setLanguage] = useState<Language>("ar");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Here you could also check localStorage
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    if (language === "ar") {
      html.setAttribute("dir", "rtl");
      html.setAttribute("lang", "ar");
    } else {
      html.setAttribute("dir", "ltr");
      html.setAttribute("lang", "en");
    }

    localStorage.setItem("language", language);
  }, [language, mounted]);

  const isArabic = language === "ar";

  // Helper for inline translation
  const t = (ar: string, en: string) => (isArabic ? ar : en);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isArabic, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
