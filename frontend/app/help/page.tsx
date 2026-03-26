"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronDown,
  Brain,
  ListTodo,
  Target,
  Mic,
  MessageSquare,
  Shield,
  Zap,
  Users,
  Clock,
  Download,
  Smartphone,
  ArrowLeft,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { LandingHeader } from "@/components/thakirni/landing-header";
import { LandingFooter } from "@/components/thakirni/landing-footer";

const steps = [
  {
    iconEn: Brain,
    titleAr: "سجّل — وذكرني يتذكر",
    titleEn: "Capture — Thakirni Remembers",
    descAr:
      "سجّل ذكرياتك، ملاحظاتك، وأفكارك بالنص أو الصوت. ذكرني يحفظها ويربطها بسياقك اليومي حتى لا يضيع شيء.",
    descEn:
      "Log your memories, notes, and ideas by text or voice. Thakirni stores them and links them to your daily context so nothing gets lost.",
  },
  {
    iconEn: ListTodo,
    titleAr: "نظّم — خططك وعاداتك وأهدافك",
    titleEn: "Organise — Plans, Habits & Goals",
    descAr:
      "أضف خططك اليومية، تتبع عاداتك، وضع أهدافاً واضحة مع مراحل تقدم. كل شيء في مكان واحد مرتب.",
    descEn:
      "Add daily plans, track habits, and set clear goals with progress milestones. Everything organised in one place.",
  },
  {
    iconEn: MessageSquare,
    titleAr: "اسأل — المساعد الذكي يفهم سياقك",
    titleEn: "Ask — AI That Understands Your Context",
    descAr:
      "المساعد الذكي يقرأ خططك وذكرياتك ويساعدك على اتخاذ قرارات أفضل، يقترح خطوات عملية، ويجيب على أسئلتك.",
    descEn:
      "The AI assistant reads your plans and memories to help you make better decisions, suggest practical steps, and answer your questions.",
  },
  {
    iconEn: Zap,
    titleAr: "أنجز — تحليلات تبيّن تقدمك",
    titleEn: "Achieve — Analytics That Show Progress",
    descAr:
      "تابع تقدمك عبر لوحة تحليلات واضحة. شاهد كيف تتحسن عاداتك وتتقدم نحو أهدافك يوماً بيوم.",
    descEn:
      "Track your progress through a clear analytics dashboard. See how your habits improve and your goals advance day by day.",
  },
];

const faqs = [
  {
    category: { ar: "البدء", en: "Getting Started" },
    items: [
      {
        qAr: "ما هو ذكرني؟",
        qEn: "What is Thakirni?",
        aAr: "ذكرني هو مساعدك الذكي الشخصي — مصمم لمساعدتك على تنظيم خططك اليومية، حفظ ذكرياتك، تتبع عاداتك وأهدافك، وتلخيص اجتماعاتك. كل ذلك بمساعدة الذكاء الاصطناعي.",
        aEn: "Thakirni is your personal AI assistant — designed to help you organise your daily plans, preserve memories, track habits and goals, and summarise meetings. All powered by AI.",
      },
      {
        qAr: "كيف أبدأ استخدام ذكرني؟",
        qEn: "How do I get started with Thakirni?",
        aAr: "أنشئ حساباً مجانياً من زر «ابدأ مجاناً»، ثم ستُوجَّه مباشرةً إلى لوحتك الشخصية. ابدأ بإضافة ذكرياتك أو خططك اليومية من القائمة الجانبية.",
        aEn: "Create a free account by clicking 'Get Started', then you'll be taken directly to your personal dashboard. Start by adding memories or daily plans from the sidebar.",
      },
      {
        qAr: "هل أحتاج إلى بطاقة ائتمانية للتسجيل؟",
        qEn: "Do I need a credit card to sign up?",
        aAr: "لا. الخطة المجانية متاحة بالكامل دون بطاقة ائتمانية. يمكنك الترقية في أي وقت.",
        aEn: "No. The free plan is fully available without a credit card. You can upgrade at any time.",
      },
    ],
  },
  {
    category: { ar: "الميزات", en: "Features" },
    items: [
      {
        qAr: "كيف يساعدني المساعد الذكي؟",
        qEn: "How does the AI assistant help me?",
        aAr: "المساعد الذكي يفهم سياق يومك — يقرأ خططك وذكرياتك وعاداتك، ويساعدك على التخطيط، الإجابة على أسئلتك، واقتراح خطوات عملية نحو أهدافك.",
        aEn: "The AI assistant understands the context of your day — it reads your plans, memories, and habits to help you plan, answer questions, and suggest practical steps toward your goals.",
      },
      {
        qAr: "كيف تعمل ميزة تلخيص الاجتماعات؟",
        qEn: "How does the meeting summary feature work?",
        aAr: "ارفع تسجيل صوتي للاجتماع أو استخدم التسجيل المباشر. ذكرني يحوّله إلى نص، ويستخرج النقاط الرئيسية وبنود الإجراءات تلقائياً.",
        aEn: "Upload a meeting recording or use live recording. Thakirni transcribes it, then automatically extracts key points and action items.",
      },
      {
        qAr: "ما هو وضع التركيز؟",
        qEn: "What is Focus mode?",
        aAr: "وضع التركيز هو مؤقت بوميدورو مدمج — اضبط مدة التركيز والاستراحة، وذكرني يتتبع جلساتك ويحفظ إحصاءاتك.",
        aEn: "Focus mode is a built-in Pomodoro timer — set your focus and break durations, and Thakirni tracks your sessions and saves your stats.",
      },
      {
        qAr: "هل يمكنني تصدير بياناتي؟",
        qEn: "Can I export my data?",
        aAr: "نعم. من الإعدادات يمكنك تصدير ذكرياتك، خططك، عاداتك، وأهدافك كملفات PDF بضغطة واحدة.",
        aEn: "Yes. From settings you can export your memories, plans, habits, and goals as PDF files with a single click.",
      },
    ],
  },
  {
    category: { ar: "الخصوصية والأمان", en: "Privacy & Security" },
    items: [
      {
        qAr: "هل بياناتي خاصة وآمنة؟",
        qEn: "Is my data private and secure?",
        aAr: "نعم. بياناتك محمية ومشفرة بالكامل. كل ذاكرة وخطة وملاحظة مربوطة بحسابك فقط — لا يمكن لأحد غيرك الوصول إليها.",
        aEn: "Yes. Your data is fully protected and encrypted. Every memory, plan, and note is tied to your account only — no one else can access it.",
      },
      {
        qAr: "هل يُستخدم محتوى بياناتي لتدريب الذكاء الاصطناعي؟",
        qEn: "Is my data used to train AI models?",
        aAr: "لا. بياناتك الشخصية لن تُستخدم لتدريب أي نموذج ذكاء اصطناعي. محتواك ملكك وحدك.",
        aEn: "No. Your personal data is never used to train any AI model. Your content belongs to you only.",
      },
    ],
  },
  {
    category: { ar: "الخطط والأسعار", en: "Plans & Pricing" },
    items: [
      {
        qAr: "ماذا يشمل الإصدار المجاني؟",
        qEn: "What does the free plan include?",
        aAr: "الخطة المجانية تشمل ١٠ خطط يومية، ٢٥ ذاكرة، مشروع واحد، محادثة AI أساسية، وتتبع العادات والأهداف.",
        aEn: "The free plan includes 10 daily plans, 25 memories, 1 project, basic AI chat, and habit & goal tracking.",
      },
      {
        qAr: "كيف أُلغي اشتراكي؟",
        qEn: "How do I cancel my subscription?",
        aAr: "يمكنك إلغاء الاشتراك في أي وقت من صفحة الإعدادات ← إدارة الاشتراك. ستظل مميزات Pro متاحة حتى نهاية الفترة المدفوعة.",
        aEn: "You can cancel your subscription at any time from Settings → Manage Subscription. Pro features remain available until the end of your paid period.",
      },
    ],
  },
  {
    category: { ar: "تقني", en: "Technical" },
    items: [
      {
        qAr: "هل يعمل ذكرني على الهاتف المحمول؟",
        qEn: "Does Thakirni work on mobile?",
        aAr: "نعم. ذكرني يعمل بالكامل على متصفح الهاتف. يمكنك أيضاً إضافته للشاشة الرئيسية كـ PWA للحصول على تجربة تشبه التطبيق.",
        aEn: "Yes. Thakirni works fully in your mobile browser. You can also add it to your home screen as a PWA for an app-like experience.",
      },
      {
        qAr: "ما اللغات التي يدعمها ذكرني؟",
        qEn: "What languages does Thakirni support?",
        aAr: "ذكرني يدعم العربية والإنجليزية بالكامل، مع واجهة مصممة للغتين ودعم RTL الكامل للعربية.",
        aEn: "Thakirni fully supports Arabic and English, with an interface designed for both languages and full RTL support for Arabic.",
      },
    ],
  },
];

function FAQItem({ qAr, qEn, aAr, aEn }: { qAr: string; qEn: string; aAr: string; aEn: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout
      className="border border-border/60 rounded-2xl overflow-hidden bg-background/60 backdrop-blur-sm"
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-semibold text-base font-headline">{t(qAr, qEn)}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-6 pb-5 text-muted-foreground leading-relaxed text-sm border-t border-border/40 pt-4">
              {t(aAr, aEn)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HelpPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#2552ca,transparent_65%)] opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#ad1d7f,transparent_50%)] opacity-15 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-[#fd65c2] animate-pulse" />
              {t("مركز المساعدة", "Help Center")}
            </div>
            <h1 className="text-5xl md:text-6xl font-headline font-bold mb-6 leading-tight">
              {t("كيف نقدر نساعدك؟", "How can we help you?")}
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              {t(
                "كل ما تحتاج معرفته عن ذكرني — كيف يعمل، أسئلة شائعة، وكل شيء بينهما.",
                "Everything you need to know about Thakirni — how it works, common questions, and everything in between."
              )}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              {t("تواصل معنا", "Contact Us")}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-headline font-bold mb-4">
              {t("كيف يعمل ذكرني؟", "How does Thakirni work?")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {t(
                "أربع خطوات بسيطة تحوّل فوضى يومك إلى وضوح وإنجاز.",
                "Four simple steps that turn your daily chaos into clarity and achievement."
              )}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => {
              const Icon = step.iconEn;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.12 }}
                  className="relative p-6 rounded-2xl border border-border/60 bg-background hover:border-[#2552ca]/50 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl power-gradient flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-3xl font-headline font-black text-[#2552ca]/20 select-none">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-base mb-2">{t(step.titleAr, step.titleEn)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(step.descAr, step.descEn)}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-muted/20">
        <div className="max-w-4xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-headline font-bold mb-4">
              {t("أسئلة شائعة", "Frequently Asked Questions")}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("أجوبة على أكثر الأسئلة التي تصلنا.", "Answers to the questions we hear most.")}
            </p>
          </motion.div>

          <div className="space-y-10">
            {faqs.map((section, si) => (
              <motion.div
                key={si}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: si * 0.08 }}
              >
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#2552ca] mb-4 px-1">
                  {t(section.category.ar, section.category.en)}
                </h3>
                <div className="space-y-3">
                  {section.items.map((item, ii) => (
                    <FAQItem key={ii} {...item} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Still need help */}
      <section className="py-20 bg-background">
        <div className="max-w-2xl mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-14 h-14 rounded-2xl power-gradient flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-headline font-bold mb-3">
              {t("ما وجدت إجابتك؟", "Didn't find your answer?")}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t(
                "فريقنا جاهز للمساعدة. راسلنا وسنرد في أقرب وقت.",
                "Our team is ready to help. Reach out and we'll get back to you soon."
              )}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full power-gradient text-white font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              {t("تواصل معنا", "Contact Us")}
            </Link>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
