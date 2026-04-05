"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { BrandLogo } from "@/components/thakirni/brand-logo";

export function LandingHeader() {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on outside tap
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  return (
    <motion.header
      ref={menuRef}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "shadow-ambient backdrop-blur-xl bg-white/90 dark:bg-[#0B0F1A]/90"
          : "bg-white/80 dark:bg-[#0B0F1A]/60 backdrop-blur-sm"
      }`}
    >
      <div className={`flex items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto ${scrolled ? "h-16" : "h-20"}`}>
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <BrandLogo className="h-11 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/#features"
            className="text-slate-600 dark:text-slate-400 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 text-sm"
          >
            {t("المميزات", "Features")}
          </Link>
          <Link
            href="/pricing"
            className="text-slate-600 dark:text-slate-400 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 text-sm"
          >
            {t("الأسعار", "Pricing")}
          </Link>
          <Link
            href="/enterprise"
            className="text-slate-600 dark:text-slate-400 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 text-sm"
          >
            {t("للمؤسسات", "Enterprise")}
          </Link>
          <Link
            href="/help"
            className="text-slate-600 dark:text-slate-400 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 text-sm"
          >
            {t("المساعدة", "Help")}
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageToggle />
          <ThemeToggle />
          <Link
            href="/auth"
            className="text-slate-600 dark:text-slate-400 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm px-4 py-2"
          >
            {t("تسجيل الدخول", "Login")}
          </Link>
          <Link href="/auth">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-full power-gradient text-white font-bold text-sm btn-glow font-label"
            >
              {t("جرّب مجاناً", "Try for Free")}
            </motion.button>
          </Link>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full"
            aria-label={t("القائمة", "Menu")}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden border-t border-slate-100 dark:border-white/8 bg-white/95 dark:bg-[#0B0F1A]/95 backdrop-blur-xl overflow-hidden z-50"
          >
            <div className="px-4 sm:px-8 py-5 flex flex-col gap-4">
              {[
                { href: "/#features",  ar: "المميزات",   en: "Features" },
                { href: "/pricing",    ar: "الأسعار",    en: "Pricing" },
                { href: "/enterprise", ar: "للمؤسسات",   en: "Enterprise" },
                { href: "/help",       ar: "المساعدة",   en: "Help" },
              ].map(({ href, ar, en }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="text-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1 text-sm font-medium font-label"
                >
                  {t(ar, en)}
                </Link>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50">
                <LanguageToggle />
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/auth" onClick={() => setMobileOpen(false)}>
                  <button className="w-full py-3 rounded-full border border-slate-300 text-slate-700 font-bold text-sm font-label">
                    {t("تسجيل الدخول", "Login")}
                  </button>
                </Link>
                <Link href="/auth" onClick={() => setMobileOpen(false)}>
                  <button className="w-full py-3 rounded-full power-gradient text-white font-bold text-sm font-label">
                    {t("جرّب مجاناً", "Try for Free")}
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
