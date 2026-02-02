"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { BrandLogo } from "@/components/thakirni/brand-logo"

export function LandingHeader() {
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
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo width={48} height={48} />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground leading-none">ذكرني</span>
              <span className="text-xs text-muted-foreground font-english" dir="ltr">Thakirni</span>
            </div>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              المميزات
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              الأسعار
            </Link>
            <Link href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              تواصل معنا
            </Link>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/auth">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/auth">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                ابدأ الآن
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </motion.header>
  )
}
