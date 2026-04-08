"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { LandingHeader } from "@/components/thakirni/landing-header"
import { LandingFooter } from "@/components/thakirni/landing-footer"
import { useLanguage } from "@/components/language-provider"
import {
  Building2, Users, BarChart3, Shield, Zap,
  CheckCircle2, ChevronRight, Star, Phone, Mail,
  Globe, Clock, Award, TrendingUp, HeartHandshake,
} from "lucide-react"

const TEAM_SIZES = [
  { value: "1-10",   ar: "١–١٠ موظفين",    en: "1–10 employees" },
  { value: "11-50",  ar: "١١–٥٠ موظفاً",   en: "11–50 employees" },
  { value: "51-200", ar: "٥١–٢٠٠ موظفاً",  en: "51–200 employees" },
  { value: "200+",   ar: "أكثر من ٢٠٠",   en: "200+ employees" },
]

const USE_CASES = [
  { value: "productivity", ar: "رفع الإنتاجية",     en: "Team productivity" },
  { value: "meetings",     ar: "تلخيص الاجتماعات",  en: "Meeting summaries" },
  { value: "knowledge",    ar: "إدارة المعرفة",      en: "Knowledge management" },
  { value: "onboarding",   ar: "تأهيل الموظفين",    en: "Employee onboarding" },
  { value: "other",        ar: "أخرى",               en: "Other" },
]

const ENTERPRISE_FEATURES = [
  {
    icon: Building2,
    ar: { title: "حسابات الشركات", desc: "لوحة تحكم مخصصة لإدارة الفريق بالكامل بمقاعد مرنة" },
    en: { title: "Company Accounts", desc: "Dedicated admin dashboard for managing your whole team with flexible seats" },
  },
  {
    icon: Users,
    ar: { title: "مساحات عمل متعددة", desc: "كل فريق في مساحة منفصلة مع صلاحيات محددة" },
    en: { title: "Multi-Team Workspaces", desc: "Separate workspaces per team with granular role permissions" },
  },
  {
    icon: BarChart3,
    ar: { title: "تحليلات الأعمال", desc: "تتبع الاستخدام والإنتاجية وعودة الاستثمار عبر الفريق بأكمله" },
    en: { title: "Business Analytics", desc: "Track usage, productivity, and ROI across your entire team" },
  },
  {
    icon: Shield,
    ar: { title: "أمان على مستوى المؤسسات", desc: "امتثال كامل للوائح نظام حماية البيانات الشخصية السعودي (PDPL)" },
    en: { title: "Enterprise-Grade Security", desc: "Full Saudi PDPL compliance, audit logs, and data residency" },
  },
  {
    icon: Zap,
    ar: { title: "تكاملات مخصصة", desc: "تكامل مع أدوات العمل الموجودة لديك عبر واجهة برمجية (API)" },
    en: { title: "Custom Integrations", desc: "Connect to your existing tools via dedicated API access" },
  },
  {
    icon: HeartHandshake,
    ar: { title: "دعم متخصص", desc: "مدير حساب مخصص وتأهيل مباشر لفريقك" },
    en: { title: "Dedicated Support", desc: "Dedicated account manager and white-glove onboarding for your team" },
  },
]

const TRUST_ITEMS = [
  { icon: Globe,     ar: "مصمم للسوق السعودي", en: "Built for Saudi Market" },
  { icon: Shield,    ar: "امتثال PDPL",          en: "PDPL Compliant" },
  { icon: Clock,     ar: "بيانات في السحابة السعودية", en: "Saudi Cloud Region" },
  { icon: Award,     ar: "دعم باللغة العربية",   en: "Arabic-First Support" },
  { icon: TrendingUp, ar: "يتوسع مع نموك",       en: "Scales With You" },
]

export default function EnterprisePage() {
  const { t, isArabic } = useLanguage()
  const [formState, setFormState] = useState({
    name: "", email: "", company: "", phone: "", team_size: "", use_case: "", message: "",
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!formState.name || !formState.email || !formState.company) {
      setError(t("يرجى ملء الحقول المطلوبة", "Please fill in required fields"))
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/enterprise/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      setError(t("حدث خطأ. حاول مرة أخرى.", "Something went wrong. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <LandingHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-transparent to-amber-400/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-600/10 text-amber-600 dark:text-amber-400 text-sm font-semibold mb-6">
                <Building2 className="w-4 h-4" />
                {t("ذكرني للمؤسسات", "Thakirni for Enterprise")}
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
                مساعد ذكاء اصطناعي{" "}
                <span className="gradient-text">
                  {t("لكامل فريقك", "for Your Whole Team")}
                </span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                {t(
                  "امنح فريقك الأدوات التي يحتاجها ليتذكر كل شيء، ويتعاون بكفاءة، وينجز أكثر — مع إدارة كاملة لمشرف الشركة.",
                  "Give your team the tools to remember everything, collaborate efficiently, and get more done — with full company admin controls."
                )}
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#demo-form"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold power-gradient btn-glow hover:opacity-90 transition-all">
                  {t("احجز عرضاً توضيحياً", "Book a Demo")}
                  <ChevronRight className="w-4 h-4" />
                </a>
                <Link href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all">
                  {t("عرض الأسعار", "View Pricing")}
                </Link>
              </div>
            </motion.div>

            {/* Right — Stats */}
            <motion.div
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { num: "10x", ar: "رفع الإنتاجية", en: "Productivity boost" },
                { num: "90%", ar: "تقليل النسيان", en: "Reduction in forgotten tasks" },
                { num: "24/7", ar: "مساعد دائم", en: "Always-on AI assistant" },
                { num: "100%", ar: "امتثال PDPL", en: "PDPL Compliant" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.en}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="glass-card rounded-2xl p-6 text-center"
                >
                  <div className="text-3xl font-bold gradient-text mb-1">{stat.num}</div>
                  <div className="text-sm text-slate-600">{t(stat.ar, stat.en)}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-slate-100 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-wrap justify-center gap-8">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.en} className="flex items-center gap-2 text-sm text-slate-600">
                  <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{t(item.ar, item.en)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            {t("كل ما تحتاجه مؤسستك", "Everything your enterprise needs")}
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            {t(
              "ميزات مصممة خصيصاً للفرق والشركات في السوق السعودي",
              "Features purpose-built for teams and companies in the Saudi market"
            )}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ENTERPRISE_FEATURES.map((feat, i) => {
            const Icon = feat.icon
            const content = isArabic ? feat.ar : feat.en
            return (
              <motion.div
                key={feat.en.title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="glass-card rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-600/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{content.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{content.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {t("تسعير مرن لكل حجم", "Flexible pricing for any size")}
            </h2>
            <p className="text-slate-500">
              {t("خصومات خاصة للجامعات والجهات الحكومية والمؤسسات التعليمية", "Special rates for universities, government entities, and educational institutions")}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                tier: t("الفرق الصغيرة", "Small Teams"),
                size: "2–10",
                price: t("٥٩٫٩٩ ر.س / شهر", "SAR 59.99/mo"),
                features: [
                  t("مقاعد غير محدودة للخطة", "Up to 10 seats"),
                  t("لوحة إدارة الفريق", "Team admin dashboard"),
                  t("تحليلات الفريق", "Team analytics"),
                ],
              },
              {
                tier: t("الشركات المتوسطة", "Growing Companies"),
                size: "11–50",
                price: t("تواصل للتسعير", "Contact for pricing"),
                highlight: true,
                features: [
                  t("مقاعد مرنة", "Flexible seats"),
                  t("كود شريك مخصص", "Dedicated partner code"),
                  t("تأهيل مباشر", "White-glove onboarding"),
                  t("مدير حساب مخصص", "Dedicated account manager"),
                ],
              },
              {
                tier: t("المؤسسات الكبرى", "Enterprise"),
                size: "50+",
                price: t("سعر مخصص", "Custom pricing"),
                features: [
                  t("عقد مخصص", "Custom contract"),
                  t("SLA مضمون", "Guaranteed SLA"),
                  t("تكامل API مخصص", "Custom API integration"),
                  t("امتثال PDPL كامل", "Full PDPL compliance audit"),
                ],
              },
            ].map((plan) => (
              <motion.div
                key={plan.tier as string}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-6 ${plan.highlight ? "power-gradient text-white shadow-lg" : "bg-white border border-slate-100"}`}
              >
                <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${plan.highlight ? "text-white/70" : "text-amber-600 dark:text-amber-400"}`}>
                  {plan.size} {t("موظف", "employees")}
                </div>
                <div className={`text-lg font-bold mb-1 ${plan.highlight ? "text-white" : "text-slate-800"}`}>{plan.tier}</div>
                <div className={`text-2xl font-bold mb-4 ${plan.highlight ? "text-white" : "gradient-text"}`}>{plan.price}</div>
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-white/90" : "text-slate-600"}`}>
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo form */}
      <section id="demo-form" className="py-20 max-w-3xl mx-auto px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            {t("احجز عرضاً توضيحياً مجانياً", "Book a Free Demo")}
          </h2>
          <p className="text-slate-500">
            {t(
              "تحدث مع فريقنا لتعرف كيف يمكن لذكرني تحويل إنتاجية مؤسستك",
              "Talk to our team and see how Thakirni can transform your organisation's productivity"
            )}
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-12 text-center space-y-4"
          >
            <div className="text-6xl">🎉</div>
            <h3 className="text-2xl font-bold text-slate-800">
              {t("شكراً لك!", "Thank you!")}
            </h3>
            <p className="text-slate-500">
              {t(
                "استلمنا طلبك وسيتواصل معك فريقنا خلال ٢٤ ساعة عبر البريد الإلكتروني أو الواتساب.",
                "We've received your request and our team will reach out within 24 hours via email or WhatsApp."
              )}
            </p>
            <Link href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold power-gradient hover:opacity-90 transition-all mt-4">
              {t("العودة للرئيسية", "Back to Home")}
            </Link>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="glass-card rounded-3xl p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  {t("الاسم الكامل", "Full name")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={e => setFormState(s => ({ ...s, name: e.target.value }))}
                  placeholder={t("محمد العمري", "Mohammed Al-Omari")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600/30 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  {t("البريد الإلكتروني", "Work email")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formState.email}
                  onChange={e => setFormState(s => ({ ...s, email: e.target.value }))}
                  placeholder="name@company.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600/30 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  {t("اسم الشركة", "Company name")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formState.company}
                  onChange={e => setFormState(s => ({ ...s, company: e.target.value }))}
                  placeholder={t("شركة أبشر", "Absher Co.")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600/30 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  {t("رقم الواتساب", "WhatsApp number")}
                </label>
                <div className="flex gap-2">
                  <span className="px-3 py-2.5 bg-slate-100 rounded-xl text-slate-500 text-sm">+966</span>
                  <input
                    type="tel"
                    value={formState.phone}
                    onChange={e => setFormState(s => ({ ...s, phone: e.target.value.replace(/\D/g,"") }))}
                    placeholder="5XXXXXXXX"
                    maxLength={9}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600/30 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  {t("حجم الفريق", "Team size")}
                </label>
                <select
                  value={formState.team_size}
                  onChange={e => setFormState(s => ({ ...s, team_size: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600/30 text-sm"
                >
                  <option value="">{t("اختر...", "Select...")}</option>
                  {TEAM_SIZES.map(ts => (
                    <option key={ts.value} value={ts.value}>{isArabic ? ts.ar : ts.en}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  {t("حالة الاستخدام", "Use case")}
                </label>
                <select
                  value={formState.use_case}
                  onChange={e => setFormState(s => ({ ...s, use_case: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600/30 text-sm"
                >
                  <option value="">{t("اختر...", "Select...")}</option>
                  {USE_CASES.map(uc => (
                    <option key={uc.value} value={uc.value}>{isArabic ? uc.ar : uc.en}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                {t("أخبرنا عن احتياجاتك", "Tell us about your needs")}
              </label>
              <textarea
                rows={4}
                value={formState.message}
                onChange={e => setFormState(s => ({ ...s, message: e.target.value }))}
                placeholder={t(
                  "ما التحديات التي يواجهها فريقك؟",
                  "What challenges is your team facing?"
                )}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600/30 text-sm resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold power-gradient btn-glow hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {t("جاري الإرسال...", "Sending...")}
                </span>
              ) : (
                <>
                  {t("احجز عرضاً توضيحياً مجانياً", "Book My Free Demo")}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              {t(
                "لن نشارك بياناتك مع أي طرف ثالث. نتواصل خلال ٢٤ ساعة.",
                "We never share your data. We'll respond within 24 hours."
              )}
            </p>
          </motion.form>
        )}
      </section>

      {/* Contact alternatives */}
      <section className="pb-20 max-w-3xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="https://wa.me/966555339782" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 glass-card rounded-2xl hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#25d366]/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#25d366]" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm group-hover:text-amber-600 dark:text-amber-400 transition-colors">
                {t("واتساب مباشر", "WhatsApp Direct")}
              </div>
              <div className="text-xs text-slate-500">+966 55 533 9782</div>
            </div>
          </a>
          <a href="mailto:enterprise@thakirni.com"
            className="flex items-center gap-4 p-5 glass-card rounded-2xl hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-600/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm group-hover:text-amber-600 dark:text-amber-400 transition-colors">
                {t("البريد الإلكتروني", "Email Us")}
              </div>
              <div className="text-xs text-slate-500">enterprise@thakirni.com</div>
            </div>
          </a>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
