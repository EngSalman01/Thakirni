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
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "shadow-sm backdrop-blur-xl bg-background/95 border-b border-border/60"
          : "bg-background/80 backdrop-blur-sm"
      }`}
    >
      <div className={`flex items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto transition-all duration-300 ${scrolled ? "h-16" : "h-20"}`}>
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <BrandLogo className="h-11 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: "/#features",  ar: "المميزات",   en: "Features" },
            { href: "/pricing",    ar: "الأسعار",    en: "Pricing" },
            { href: "/enterprise", ar: "للمؤسسات",   en: "Enterprise" },
            { href: "/help",       ar: "المساعدة",   en: "Help" },
          ].map(({ href, ar, en }) => (
            <Link
              key={href}
              href={href}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150"
            >
              {t(ar, en)}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Link
            href="/auth"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("تسجيل الدخول", "Login")}
          </Link>
          <Link href="/auth">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-2.5 rounded-xl power-gradient text-white font-bold text-sm btn-glow"
            >
              {t("جرّب مجاناً", "Try for Free")}
            </motion.button>
          </Link>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
            className="md:hidden border-t border-border/60 bg-background/98 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 sm:px-8 py-5 flex flex-col gap-1">
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
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {t(ar, en)}
                </Link>
              ))}
              <div className="flex items-center gap-2 pt-3 border-t border-border/60 mt-2">
                <LanguageToggle />
              </div>
              <div className="flex flex-col gap-2 mt-1">
                <Link href="/auth" onClick={() => setMobileOpen(false)}>
                  <button className="w-full py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors">
                    {t("تسجيل الدخول", "Login")}
                  </button>
                </Link>
                <Link href="/auth" onClick={() => setMobileOpen(false)}>
                  <button className="w-full py-3 rounded-xl power-gradient text-white font-bold text-sm">
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
