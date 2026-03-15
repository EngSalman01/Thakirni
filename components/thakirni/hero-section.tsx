"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield, Lock, Server } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export function HeroSection() {
  const { t, isArabic } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20" style={{
      background: "linear-gradient(135deg, #0a0f1e 0%, #1a1a3e 25%, #0f1a2e 50%, #0a0f1e 75%, #1a0f2e 100%)",
      backgroundSize: "400% 400%",
    }}>
      {/* Animated gradient mesh background */}
      <style>{`
        @keyframes mesh-gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .mesh-gradient {
          animation: mesh-gradient 8s ease infinite;
        }
      `}</style>
      
      {/* Glowing orbs - floating decorative elements */}
      <motion.div 
        className="absolute top-20 start-10 w-72 h-72 rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)" }}
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute -bottom-20 -end-20 w-96 h-96 rounded-full blur-3xl opacity-25"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)" }}
        animate={{ y: [0, 40, 0], x: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div 
        className="absolute top-1/2 end-20 w-80 h-80 rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)" }}
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          {/* Badge with emerald glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border border-emerald-500/30 glass-dark"
            style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.2)" }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "#10b981" }} />
            <span className="text-sm text-foreground">
              {t("✨ الذاكرة الثانية الرقمية", "✨ Your Second Digital Brain")}
            </span>
          </motion.div>

          {/* Main headline with emerald accent */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-foreground leading-tight text-balance tracking-tighter">
            {t(
              "لست مصمماً لتتذكر",
              "You're not designed to",
            )}
            <br />
            {t(
              "كل شيء",
              "remember everything",
            )}
            <span className="block mt-4" style={{ color: "#10b981", textShadow: "0 0 20px rgba(16, 185, 129, 0.3)" }}>
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

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/auth">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  style={{
                    backgroundColor: "#10b981",
                    color: "white",
                    boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)",
                  }}
                  className="font-bold text-lg px-8 py-6 rounded-xl hover:shadow-xl transition-all duration-300 border-0"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 40px rgba(16, 185, 129, 0.6)";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 30px rgba(16, 185, 129, 0.4)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {t("ابدأ الآن", "Get Started")}
                </Button>
              </motion.div>
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
