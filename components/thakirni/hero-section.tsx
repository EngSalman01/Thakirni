"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield, Lock, Server } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export function HeroSection() {
  const { t, isArabic } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center islamic-pattern overflow-hidden pt-20">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />

      {/* Decorative elements */}
      <div className="absolute top-20 start-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 end-10 w-96 h-96 bg-emerald-800/20 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-md border border-border px-4 py-2 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground/80">
              {t("ذاكرتك الثانية الرقمية", "Your Second Digital Brain")}
            </span>
          </motion.div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 text-foreground leading-tight text-balance">
            {t(
              "لست مصمماً لتتذكر كل شيء..",
              "You are not designed to remember everything..",
            )}
            <span className="block bg-gradient-to-l from-primary to-primary/80 bg-clip-text text-transparent mt-2 tracking-tighter leading-[2]">
              {t("'ذكرني' تتكفل بذلك", "'Thakirni' handles it for you")}
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            {t(
              "ذاكرتك الثانية لحفظ كل اللحظات. آمنة، خاصة، وصُممت من أجلك.",
              "Your second brain to preserve every moment. Secure, private, and designed for you.",
            )}
          </p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
              >
                {t("ابدأ تجربتك المجانية", "Start Your Free Trial")}
                <span className="font-english ms-2 text-sm opacity-80">
                  {t("Start Organizing", "")}
                </span>
              </Button>
            </Link>

            <Link href="#features">
              <Button
                variant="outline"
                size="lg"
                className="border-border text-foreground hover:bg-muted px-8 py-6 rounded-xl bg-transparent"
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
            className="mt-16 flex flex-wrap justify-center gap-6"
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
                className="flex items-center gap-3 bg-card/50 backdrop-blur-sm border border-border rounded-xl px-4 py-3"
              >
                <badge.icon className="w-5 h-5 text-primary" />
                <div className="text-start">
                  <div className="text-sm font-medium text-foreground">
                    {t(badge.labelAr, badge.labelEn)}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
