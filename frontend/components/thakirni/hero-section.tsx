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
    <section className="relative pt-40 pb-32 overflow-hidden hero-mesh min-h-screen flex items-center">
      {/* Particle layer */}
      <div ref={particleRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: Copy ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {/* Headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-headline font-extrabold tracking-tight leading-[0.9] text-slate-900 dark:text-white">
              {isArabic ? (
                <span>
                  أنت <span className="text-[#2552ca] italic">لست</span>
                  {" "}مصمماً لتتذكر كل شيء.
                </span>
              ) : (
                <span>
                  You are <span className="text-[#2552ca] italic">not</span>{" "}
                  designed to remember everything.
                </span>
              )}
            </h1>

            {/* Sub */}
            <p className="text-xl text-slate-500 font-light max-w-xl leading-relaxed">
              {t(
                "ذكرني هو امتدادك الرقمي. مساعد ذكي يلتقط ويربط ويعيد إحياء معرفتك قبل أن تتلاشى.",
                "Thakirni is your digital aura. An AI-powered extension of your mind that captures, connects, and resurfaces knowledge before it fades."
              )}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-10 py-5 rounded-full power-gradient text-white font-bold text-lg shadow-xl btn-glow font-label"
                >
                  {t("جرّب مجاناً", "Try for Free")}
                </motion.button>
              </Link>
              <Link href="/vault">
                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-10 py-5 rounded-full bg-[#eae8e7] text-[#2552ca] font-bold text-lg hover:bg-[#e4e2e1] transition-all font-label"
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

            <div className="relative bg-white rounded-2xl p-4 shadow-card hover-lift">
              {/* Aura visualization */}
              <div className="rounded-xl w-full h-[460px] bg-gradient-to-br from-[#dce1ff] via-[#f0eded] to-[#ffd8e9] flex items-center justify-center relative overflow-hidden">
                <div className="relative w-56 h-56">
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

              {/* Floating notification — entry + idle bob */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.7 }}
                className="absolute -bottom-6 -left-6 max-w-xs"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                  className="bg-white p-5 rounded-xl shadow-2xl flex items-center gap-4 border-l-4 border-[#ad1d7f]"
                >
                  <div className="w-10 h-10 rounded-full power-gradient flex items-center justify-center shrink-0">
                    <span className="text-white text-lg">🧠</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 font-label">
                      {t("تم الحفظ", "Saved")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t("ملاحظاتك الآن قابلة للبحث.", "Your meeting notes are now searchable.")}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
