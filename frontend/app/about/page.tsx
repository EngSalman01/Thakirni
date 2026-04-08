"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LandingHeader } from "@/components/thakirni/landing-header";
import { LandingFooter } from "@/components/thakirni/landing-footer";
import { useLanguage } from "@/components/language-provider";
import { Sparkles, Code2, Heart, Rocket, Brain, Globe } from "lucide-react";

const FADE_UP = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, ease: [0.2, 1, 0.3, 1] },
};

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="relative pt-36 pb-28 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #92400e 0%, #D97706 45%, #F59E0B 80%, #FBBF24 100%)",
        }}
      >
        {/* Blobs */}
        <motion.div
          className="absolute top-10 left-16 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #FBBF24, transparent 70%)" }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 right-16 w-60 h-60 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, #D97706, transparent 70%)" }}
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white/80 text-sm font-label mb-8"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <Sparkles className="w-4 h-4" />
            {t("قصة ذكرني", "The Thakirni Story")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl font-headline font-extrabold text-white mb-6 leading-tight"
          >
            {t("بُني بشغف،", "Built with passion,")}
            <br />
            <span style={{ color: "#fde68a" }}>
              {t("من شخص واحد", "by one person")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white/75 text-xl font-label leading-relaxed max-w-2xl mx-auto"
          >
            {t(
              "ذكرني مش شركة. هو مشروع صنعه شخص واحد يؤمن إن الذاكرة والإنتاجية يستاهلون أكثر من التطبيقات الحالية.",
              "Thakirni isn't a company. It's a project built by one person who believes memory and productivity deserve better tools.",
            )}
          </motion.p>
        </div>
      </section>

      {/* ── Founder ──────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">

            {/* Avatar card */}
            <motion.div {...FADE_UP} className="flex justify-center">
              <div
                className="relative w-72 h-72 rounded-3xl overflow-hidden shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, #92400e 0%, #D97706 50%, #F59E0B 100%)",
                }}
              >
                {/* Initials */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-headline font-extrabold text-white shadow-lg mb-4"
                    style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "2px solid rgba(255,255,255,0.3)" }}
                  >
                    سلـ
                  </div>
                  <p className="text-white font-headline font-bold text-xl">Salman Almnaseer</p>
                  <p className="text-white/70 text-sm font-label mt-1">
                    {t("مطوّر ومؤسس ذكرني", "Developer & Founder of Thakirni")}
                  </p>
                </div>
                {/* Decorative ring */}
                <motion.div
                  className="absolute inset-[-8px] rounded-3xl border border-white/10"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </motion.div>

            {/* Bio */}
            <motion.div {...FADE_UP} className="space-y-6">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest font-label mb-3"
                  style={{ color: "#D97706" }}
                >
                  {t("من نحن", "About")}
                </p>
                <h2 className="text-3xl font-headline font-extrabold text-foreground leading-tight">
                  {t("سلمان المناصير", "Salman Almnaseer")}
                </h2>
              </div>

              <p className="text-muted-foreground leading-relaxed font-label">
                {t(
                  "أنا سلمان، المطوّر الوحيد وراء ذكرني. بنيت هذا المشروع لأني ما لقيت تطبيقاً عربياً يفهم احتياجاتي كشخص يفكر بالعربي ويعيش في السعودية.",
                  "I'm Salman, the solo developer behind Thakirni. I built this because I couldn't find an Arabic-first app that truly understood how I think and live in Saudi Arabia.",
                )}
              </p>

              <p className="text-muted-foreground leading-relaxed font-label">
                {t(
                  "ذكرني هو ذاكرتي الثانية — مكان أحفظ فيه أفكاري، مواعيدي، وعاداتي. كل سطر كود كتبته بنفسي، وكل قرار تصميمي اتخذته بناءً على احتياجات حقيقية.",
                  "Thakirni is my second brain — where I store thoughts, appointments, habits and memories. Every line of code was written by me, every design decision made based on real needs.",
                )}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                {[
                  { icon: Code2,  label: t("مطوّر Full-Stack", "Full-Stack Developer") },
                  { icon: Brain,  label: t("بناء الـ AI", "AI Builder") },
                  { icon: Globe,  label: t("السعودية", "Saudi Arabia") },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-label font-semibold"
                    style={{ background: "rgba(217,119,6,0.08)", color: "#D97706", border: "1px solid rgba(217,119,6,0.15)" }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-8">
          <motion.div {...FADE_UP} className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest font-label mb-3" style={{ color: "#D97706" }}>
              {t("رسالتنا", "Mission")}
            </p>
            <h2 className="text-4xl font-headline font-extrabold text-foreground">
              {t("لماذا ذكرني؟", "Why Thakirni?")}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                titleAr: "ذاكرة ثانية حقيقية",
                titleEn: "A Real Second Brain",
                textAr: "مش مجرد تطبيق مهام. ذكرني يحفظ أفكارك، صوتك، صورك، وروابطك في مكان واحد.",
                textEn: "Not just a task app. Thakirni stores your thoughts, voice notes, images and links in one place.",
                color: "#D97706",
              },
              {
                icon: Heart,
                titleAr: "مصنوع بالسعودي",
                titleEn: "Made for Arabic Speakers",
                textAr: "كل كلمة في الواجهة كُتبت بلهجة سعودية واضحة. لأن التطبيقات العربية تستاهل أحسن.",
                textEn: "Every word in the interface was written in natural Saudi Arabic. Arabic speakers deserve better.",
                color: "#F59E0B",
              },
              {
                icon: Rocket,
                titleAr: "يتطور باستمرار",
                titleEn: "Constantly Evolving",
                textAr: "كمطوّر منفرد، أقدر أتحرك سريع وأضيف ميزات بناءً على ملاحظات المستخدمين مباشرة.",
                textEn: "As a solo developer, I move fast and add features directly based on user feedback.",
                color: "#059669",
              },
            ].map(({ icon: Icon, titleAr, titleEn, textAr, textEn, color }) => (
              <motion.div
                key={titleEn}
                {...FADE_UP}
                className="p-6 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}14` }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3 className="font-headline font-bold text-lg text-foreground mb-2">
                  {t(titleAr, titleEn)}
                </h3>
                <p className="text-muted-foreground text-sm font-label leading-relaxed">
                  {t(textAr, textEn)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <motion.div {...FADE_UP} className="space-y-6">
            <h2 className="text-4xl font-headline font-extrabold text-foreground">
              {t("عندك سؤال أو فكرة؟", "Have a question or idea?")}
            </h2>
            <p className="text-muted-foreground font-label text-lg">
              {t("أنا دايماً أرد على الرسائل شخصياً.", "I always respond to messages personally.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link href="/contact">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3 rounded-full text-white font-bold text-sm font-label shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #D97706 0%, #FBBF24 100%)",
                    boxShadow: "0 4px 24px rgba(217,119,6,0.35)",
                  }}
                >
                  {t("تواصل معي", "Contact Me")}
                </motion.button>
              </Link>
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3 rounded-full font-bold text-sm font-label border border-border text-foreground hover:bg-muted transition-colors"
                >
                  {t("جرّب ذكرني مجاناً", "Try Thakirni Free")}
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
