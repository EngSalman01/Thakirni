"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { BrandLogo } from "@/components/thakirni/brand-logo";
import { useLanguage } from "@/components/language-provider";
import { Menu, X } from "lucide-react";

export function LandingHeader() {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50"
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <BrandLogo size="sm" variant="icon" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              {t("المميزات", "Features")}
            </Link>
            <Link
              href="/pricing"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              {t("الأسعار", "Pricing")}
            </Link>
            <Link
              href="#contact"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              {t("تواصل معنا", "Contact")}
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/auth">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                {t("تسجيل الدخول", "Login")}
              </Button>
            </Link>
            <Link href="/auth">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                {t("ابدأ الآن", "Start Now")}
              </Button>
            </Link>
          </div>

          {/* Mobile: theme + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={t("القائمة", "Menu")}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <Link
                href="#features"
                onClick={() => setMobileOpen(false)}
                className="text-foreground hover:text-primary transition-colors py-2 text-sm font-medium"
              >
                {t("المميزات", "Features")}
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="text-foreground hover:text-primary transition-colors py-2 text-sm font-medium"
              >
                {t("الأسعار", "Pricing")}
              </Link>
              <Link
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className="text-foreground hover:text-primary transition-colors py-2 text-sm font-medium"
              >
                {t("تواصل معنا", "Contact")}
              </Link>

              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <LanguageToggle />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link href="/auth" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full bg-transparent">
                    {t("تسجيل الدخول", "Login")}
                  </Button>
                </Link>
                <Link href="/auth" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    {t("ابدأ الآن", "Start Now")}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
