"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield, Lock, Server } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export function HeroSection() {
  const { t, isArabic } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 hero-mesh bg-surface">
      {/* Floating orbs */}
      <motion.div
        className="absolute top-20 start-10 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle, rgba(37, 82, 202, 0.3) 0%, transparent 70%)" }}
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 -end-20 w-96 h-96 rounded-full blur-3xl opacity-15"
        style={{ background: "radial-gradient(circle, rgba(253, 101, 194, 0.3) 0%, transparent 70%)" }}
        animate={{ y: [0, 40, 0], x: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative z-10 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Left: Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-fixed text-on-secondary-fixed border border-secondary/20 animate-soft-pulse"
            >
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">
                {t("✨ الذاكرة الثانية الرقمية", "✨ Your Second Digital Brain")}
              </span>
            </motion.div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline font-extrabold tracking-tight leading-[0.95] text-on-background">
              {t(
                "لست مصمماً لتتذكر",
                "You're not designed to",
              )}
              <br />
              {t(
                "كل شيء",
                "remember everything",
              )}
              <span className="block mt-4 gradient-text">
                {t("'ذكرني' تتكفل بذلك", "'Thakirni' handles it for you")}
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-xl">
              {t(
                "ذاكرتك الثانية لحفظ كل اللحظات. آمنة، خاصة، وصُممت من أجلك.",
                "Your second brain to preserve every moment. Secure, private, and designed for you.",
              )}
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/auth">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className="power-gradient text-white font-bold text-lg px-10 py-6 rounded-full shadow-card hover:shadow-ambient transition-all duration-300"
                  >
                    {t("ابدأ الآن", "Get Started")}
                  </Button>
                </motion.div>
              </Link>

              <Link href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-outline-variant text-on-surface hover:bg-surface-container-high px-10 py-6 rounded-full bg-transparent"
                >
                  {t("اكتشف المزيد", "Discover More")}
                </Button>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              {[
                {
                  icon: Server,
                  labelAr: "بياناتك في السعودية",
                  labelEn: "Saudi Hosted Data",
                },
                {
                  icon: Lock,
                  labelAr: "تشفير كامل",
                  labelEn: "End-to-End Encryption",
                },
                { icon: Shield, labelAr: "خاصة ١٠٠٪", labelEn: "100% Private" },
              ].map((badge, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-surface-container-lowest backdrop-blur-sm border border-outline-variant rounded-xl px-4 py-3 shadow-ambient"
                >
                  <badge.icon className="w-5 h-5 text-primary" />
                  <div className="text-start">
                    <div className="text-sm font-medium text-on-surface">
                      {t(badge.labelAr, badge.labelEn)}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full"></div>
            <div className="relative bg-surface-container-lowest rounded-xl p-4 shadow-card hover-lift">
              <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-primary/10 via-secondary/10 to-tertiary/10 flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="w-20 h-20 mx-auto rounded-full power-gradient flex items-center justify-center animate-soft-pulse">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-2xl font-headline font-bold text-on-surface">
                    {t("عقلك الثاني", "Your Second Brain")}
                  </p>
                  <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
                    {t(
                      "احفظ كل لحظة، فكرة، واجتماع في مكان واحد آمن",
                      "Save every moment, idea, and meeting in one secure place"
                    )}
                  </p>
                </div>
              </div>

              {/* Floating notification card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="absolute -bottom-8 -left-8 bg-surface-container-lowest p-6 rounded-lg shadow-card border-l-4 border-secondary animate-float max-w-xs"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full power-gradient flex items-center justify-center text-white">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      {t("تم المزامنة", "Memory Synced")}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {t("ملاحظاتك محفوظة بأمان", "Your notes are safely stored")}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-surface to-transparent" />
    </section>
  );
}
