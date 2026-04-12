"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { BrandLogo } from "@/components/thakirni/brand-logo";

const PRODUCT_LINKS = [
  { href: "/#features", ar: "المميزات", en: "Features" },
  { href: "/pricing", ar: "الأسعار", en: "Pricing" },
  { href: "/enterprise", ar: "للمؤسسات", en: "Enterprise" },
  { href: "/help", ar: "مركز المساعدة", en: "Help Center" },
];

const COMPANY_LINKS = [
  { href: "/about", ar: "من نحن", en: "About" },
  { href: "/contact", ar: "تواصل معنا", en: "Contact" },
  { href: "/privacy", ar: "سياسة الخصوصية", en: "Privacy Policy" },
  { href: "/terms", ar: "الشروط والأحكام", en: "Terms" },
];

const SHARE_LINKS = [
  {
    href: "https://wa.me/?text=جرّب%20ذكرني%20https%3A%2F%2Fthakirni.com",
    label: "WhatsApp",
  },
  {
    href: "https://twitter.com/intent/tweet?text=Try%20Thakirni%20%E2%80%94%20your%20AI%20assistant&url=https%3A%2F%2Fthakirni.com",
    label: "X",
  },
  {
    href: "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fthakirni.com",
    label: "LinkedIn",
  },
];

export function LandingFooter() {
  const { t, isArabic } = useLanguage();

  return (
    <footer dir={isArabic ? "rtl" : "ltr"} className="relative overflow-hidden bg-[#080603] text-slate-300">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-72 w-[60rem] -translate-x-1/2 bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-56 w-56 bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-8 sm:pt-24">
        <div className="shell-panel-dark mb-10 p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
            <div className="max-w-2xl">
              <span className="eyebrow-badge border-white/10 bg-white/[0.04] text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                {t("جاهز للإطلاق", "Production-ready polish")}
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t(
                  "واجهة عربية أنيقة. سرعة واضحة. وثقة من أول ثانية.",
                  "Arabic-first elegance, clear speed, and trust from the first second."
                )}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                {t(
                  "ذكرني مبني ليشعرك أن كل شيء تحت السيطرة: التذكيرات، الذاكرة، واتساب، واللوحة كلها في تجربة واحدة متماسكة.",
                  "Thakirni is built to feel calm and in-control: reminders, memory, WhatsApp, and the vault all working inside one cohesive experience."
                )}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                {
                  title: t("عربي أولاً", "Arabic first"),
                  body: t("تجربة مصقولة للمستخدم الخليجي", "Polished for GCC users"),
                },
                {
                  title: t("خصوصية واضحة", "Clear privacy"),
                  body: t("بياناتك تبقى داخل فولت آمن", "Your data stays in a secure vault"),
                },
                {
                  title: t("تجربة أسرع", "Smoother UX"),
                  body: t("حركة أخف وتصفح أوضح", "Lighter motion and cleaner flow"),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                >
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_0.8fr]">
          <div>
            <BrandLogo variant="full" className="h-8 w-auto" />
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              {t(
                "مساعدك الذكي الشخصي لتنظيم اليوم، حفظ الذكريات، وتخفيف الزحمة الذهنية بشكل جميل وواضح.",
                "Your personal AI assistant for organising the day, preserving memories, and reducing mental clutter with a beautiful, clear experience."
              )}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                {t("فولت آمن", "Secure vault")}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                {t("واتساب + ويب", "WhatsApp + web")}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {SHARE_LINKS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-amber-400/40 hover:text-white"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300/85">
              {t("المنتج", "Product")}
            </h3>
            <div className="mt-5 space-y-3">
              {PRODUCT_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 transition-all hover:border-amber-400/35 hover:bg-white/[0.05] hover:text-white"
                >
                  <span>{isArabic ? item.ar : item.en}</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-300" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300/85">
              {t("الشركة", "Company")}
            </h3>
            <div className="mt-5 space-y-3">
              {COMPANY_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 transition-all hover:border-amber-400/35 hover:bg-white/[0.05] hover:text-white"
                >
                  <span>{isArabic ? item.ar : item.en}</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 soft-divider" />

        <div className="flex flex-col gap-3 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>{t("© 2026 ذكرني. جميع الحقوق محفوظة.", "© 2026 Thakirni. All rights reserved.")}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-amber-300">
              {t("سياسة الخصوصية", "Privacy Policy")}
            </Link>
            <Link href="/terms" className="hover:text-amber-300">
              {t("الشروط", "Terms")}
            </Link>
            <Link href="/contact" className="hover:text-amber-300">
              {t("تواصل معنا", "Contact")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
