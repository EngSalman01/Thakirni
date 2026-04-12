"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, ShieldCheck, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { BrandLogo } from "@/components/thakirni/brand-logo";

const NAV_ITEMS = [
  { href: "/#features", ar: "المميزات", en: "Features" },
  { href: "/pricing", ar: "الأسعار", en: "Pricing" },
  { href: "/enterprise", ar: "للمؤسسات", en: "Enterprise" },
  { href: "/help", ar: "المساعدة", en: "Help" },
];

export function LandingHeader() {
  const { t, isArabic } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [mobileOpen]);

  return (
    <motion.header
      ref={headerRef}
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4 pointer-events-none"
    >
      <div className="mx-auto max-w-7xl pointer-events-auto">
        <div
          className={cn(
            "shell-panel px-3 sm:px-4 transition-all duration-300",
            scrolled ? "shadow-[0_20px_60px_rgba(26,18,8,0.12)]" : "shadow-[0_28px_80px_rgba(26,18,8,0.10)]"
          )}
        >
          <div className="flex min-h-[4.4rem] items-center gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3 py-3">
              <BrandLogo variant="auto" iconSize={36} />
              <div className="hidden xl:flex flex-col leading-none">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-amber-700/85 dark:text-amber-300/90">
                  {t("مساعد إنتاجية شخصي", "Personal AI Memory")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("مبني للسوق السعودي", "Built for Saudi life")}
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex flex-1 justify-center">
              <nav className="nav-shell flex items-center gap-1 p-1.5" aria-label="Primary navigation">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:bg-white/80 hover:text-foreground dark:hover:bg-white/[0.06]"
                  >
                    {isArabic ? item.ar : item.en}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="ms-auto flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 nav-shell px-1.5 py-1.5">
                <LanguageToggle />
                <ThemeToggle />
              </div>

              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/auth"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("تسجيل الدخول", "Login")}
                </Link>
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 rounded-full power-gradient px-5 py-2.5 text-sm font-bold text-white shadow-lg btn-glow"
                >
                  <Sparkles className="h-4 w-4" />
                  {t("ابدأ مجاناً", "Start Free")}
                </Link>
              </div>

              <button
                onClick={() => setMobileOpen((value) => !value)}
                className="flex h-11 w-11 items-center justify-center rounded-full nav-shell text-foreground transition-colors md:hidden"
                aria-label={t("القائمة", "Menu")}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 md:hidden"
            >
              <div className="shell-panel overflow-hidden px-4 py-4">
                <div className="mb-4 flex items-start justify-between gap-3 rounded-[1.3rem] bg-white/70 px-4 py-4 dark:bg-white/[0.04]">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                      {t("الإطلاق القادم", "Shipping next week")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(
                        "واجهة أسرع، أوضح، وأجمل للمستخدمين من أول ثانية.",
                        "A faster, clearer, more polished first impression."
                      )}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                </div>

                <nav className="space-y-1.5" aria-label="Mobile navigation">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between rounded-2xl border border-border/70 bg-white/70 px-4 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-amber-300/60 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
                    >
                      <span>{isArabic ? item.ar : item.en}</span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </nav>

                <div className="my-4 soft-divider" />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 nav-shell px-1.5 py-1.5">
                    <LanguageToggle />
                    <ThemeToggle />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl border border-border/80 bg-white/75 px-4 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                  >
                    {t("تسجيل الدخول", "Login")}
                  </Link>
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl power-gradient px-4 py-3 text-center text-sm font-bold text-white"
                  >
                    <Sparkles className="h-4 w-4" />
                    {t("ابدأ الآن", "Start Now")}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
