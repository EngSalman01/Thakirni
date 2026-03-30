"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";

export function HeroSection() {
  const { t, isArabic } = useLanguage();
  const particleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = particleRef.current;
    if (!container) return;
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div");
      const size = Math.random() * 8 + 4;
      const duration = Math.random() * 20 + 10;
      const delay = Math.random() * -20;
      p.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;
        left:${Math.random() * 100}%;top:${Math.random() * 100}%;
        background:rgba(37,82,202,0.12);border-radius:50%;filter:blur(2px);
        --drift-x:${(Math.random() - 0.5) * 200}px;
        --drift-y:${(Math.random() - 0.5) * 200}px;
        --duration:${duration}s;
        animation:particle-drift ${duration}s linear ${delay}s infinite;
        pointer-events:none;
      `;
      container.appendChild(p);
      particles.push(p);
    }
    return () => particles.forEach((p) => p.remove());
  }, []);

  return (
    <section className="relative pt-24 pb-16 sm:pt-40 sm:pb-32 overflow-hidden hero-mesh min-h-screen flex items-center">
      {/* Particle layer */}
      <div ref={particleRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

          {/* ── Left: Copy ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 1, 0.3, 1] }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-headline font-extrabold tracking-tight leading-[1.2] text-slate-900 dark:text-white">
              {isArabic ? (
                <span>
                  رتّب حياتك…{" "}
                  <span className="gradient-text">وخلي الذكاء الاصطناعي</span>
                  {" "}يسوي الشغل الثقيل
                </span>
              ) : (
                <span>
                  Organise your life…{" "}
                  <span className="gradient-text">let AI</span>
                  {" "}do the heavy lifting
                </span>
              )}
            </h1>

            {/* Sub */}
            <p className="text-base sm:text-lg md:text-xl text-slate-500 font-light max-w-xl leading-relaxed">
              {t(
                "من مهامك اليومية لاجتماعاتك… خلنا ننظمها لك بسهولة. ويشتغل كمان على واتساب — ما تحتاج تنزّل شي.",
                "From your daily tasks to your meetings — we'll organise it all for you. Also works on WhatsApp — no app needed."
              )}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-7 py-4 sm:px-10 sm:py-5 rounded-full power-gradient text-white font-bold text-base sm:text-lg shadow-xl btn-glow font-label"
                >
                  {t("ابدأ الحين", "Start Now")}
                </motion.button>
              </Link>
              <Link href="/vault">
                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-7 py-4 sm:px-10 sm:py-5 rounded-full bg-[#eae8e7] text-[#2552ca] font-bold text-base sm:text-lg hover:bg-[#e4e2e1] transition-all font-label"
                >
                  {t("تحدث مع ذكرني", "Talk to Thakirni")}
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* ── Right: Visual ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#2552ca]/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Aura visualization */}
            <div className="rounded-2xl w-full h-64 sm:h-80 lg:h-[460px] bg-gradient-to-br from-[#dce1ff] via-[#f0eded] to-[#ffd8e9] flex items-center justify-center relative overflow-hidden">
              <div className="relative w-40 h-40 sm:w-52 sm:h-52 lg:w-56 lg:h-56">
                <div className="absolute inset-0 rounded-full border-2 border-[#2552ca]/20 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border border-[#fd65c2]/20 animate-[spin_15s_linear_infinite_reverse]" />
                <div className="absolute inset-10 rounded-full bg-gradient-to-br from-[#2552ca] to-[#fd65c2] shadow-[0_0_60px_rgba(37,82,202,0.4)] flex items-center justify-center">
                  <span className="text-white text-3xl font-headline font-bold">ذ</span>
                </div>
                {/* Orbital nodes */}
                {[
                  { pos: "top-0 left-1/2 -translate-x-1/2 -translate-y-4", label: "AI", color: "text-[#2552ca]" },
                  { pos: "bottom-0 left-1/2 -translate-x-1/2 translate-y-4", label: "⚡", color: "text-[#ad1d7f]" },
                  { pos: "left-0 top-1/2 -translate-y-1/2 -translate-x-4", label: "📄", color: "text-slate-600" },
                  { pos: "right-0 top-1/2 -translate-y-1/2 translate-x-4", label: "🎙️", color: "text-slate-600" },
                ].map(({ pos, label, color }) => (
                  <div
                    key={label}
                    className={`absolute ${pos} w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-sm font-bold ${color}`}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
