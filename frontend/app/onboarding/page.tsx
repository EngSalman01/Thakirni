"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/components/language-provider"

const STEPS = 4

const USE_CASES = [
  { id: "goals",        ar: "تحقيق الأهداف",         en: "Achieve goals",       icon: "🎯" },
  { id: "habits",       ar: "بناء عادات يومية",       en: "Build daily habits",  icon: "🔄" },
  { id: "tasks",        ar: "تنظيم المهام",            en: "Organize tasks",      icon: "✅" },
  { id: "meetings",     ar: "تلخيص الاجتماعات",       en: "Summarize meetings",  icon: "🎙️" },
  { id: "reminders",    ar: "تذكيرات ذكية",            en: "Smart reminders",     icon: "⏰" },
  { id: "notes",        ar: "حفظ الأفكار والملاحظات", en: "Save notes & ideas",  icon: "📝" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { t, isArabic } = useLanguage()
  const [step, setStep] = useState(1)
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([])
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const progress = ((step - 1) / (STEPS - 1)) * 100

  function toggleUseCase(id: string) {
    setSelectedUseCases(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    )
  }

  async function markOnboarded() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth"); return null }
    await supabase.from("profiles")
      .update({ onboarded_at: new Date().toISOString() })
      .eq("id", user.id)
    return user
  }

  async function finish() {
    setLoading(true)
    try {
      const user = await markOnboarded()
      if (!user) return

      // Update name if provided
      if (name.trim()) {
        await supabase.from("profiles")
          .update({ full_name: name.trim() })
          .eq("id", user.id)
      }

      // Log onboarding completion (fire and forget)
      supabase.from("analytics_events").insert({
        user_id: user.id,
        event_name: "onboarding_completed",
        properties: { use_cases: selectedUseCases, has_phone: !!phone },
      }).then(() => {})

      // Send WhatsApp welcome if phone provided (fire and forget)
      if (phone.trim()) {
        fetch("/api/whatsapp/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone.trim(), name }),
        }).catch(() => {})
      }

      router.push("/vault")
    } catch {
      router.push("/vault")
    } finally {
      setLoading(false)
    }
  }

  async function skip() {
    try {
      await markOnboarded()
    } catch {}
    router.push("/vault")
  }

  return (
    <div className="min-h-screen bg-[#fbf9f8] flex flex-col items-center justify-center px-4 py-12" dir={isArabic ? "rtl" : "ltr"}>

      {/* Progress bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-500">{t("الإعداد", "Setup")} {step}/{STEPS}</span>
          <button onClick={skip} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            {t("تخطي", "Skip")}
          </button>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(135deg, #2552ca 0%, #fd65c2 100%)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">

          {/* Step 1: Welcome */}
          {step === 1 && (
            <motion.div key="s1"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="glass-card rounded-3xl p-8 text-center space-y-6"
            >
              <div className="text-6xl">👋</div>
              <h1 className="text-3xl font-bold gradient-text">
                {t("أهلاً بك في ذكرني!", "Welcome to Thakirni!")}
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed">
                {t(
                  "سنساعدك على الإعداد في أقل من دقيقتين.",
                  "We'll get you set up in under 2 minutes."
                )}
              </p>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 text-start">
                  {t("اسمك (اختياري)", "Your name (optional)")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t("أدخل اسمك", "Enter your name")}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2552ca]/30 text-slate-800"
                />
              </div>
              <button onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl text-white font-semibold power-gradient btn-glow transition-all hover:opacity-90">
                {t("هيا نبدأ!", "Let's go!")}
              </button>
            </motion.div>
          )}

          {/* Step 2: Use case selection */}
          {step === 2 && (
            <motion.div key="s2"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="glass-card rounded-3xl p-8 space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {t("ماذا تريد أن تحقق؟", "What do you want to achieve?")}
                </h2>
                <p className="text-slate-500 mt-1 text-sm">
                  {t("اختر كل ما ينطبق عليك", "Select all that apply")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {USE_CASES.map(uc => {
                  const selected = selectedUseCases.includes(uc.id)
                  return (
                    <button key={uc.id} onClick={() => toggleUseCase(uc.id)}
                      className={`p-4 rounded-xl border-2 text-start transition-all ${
                        selected
                          ? "border-[#2552ca] bg-[#2552ca]/5"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}>
                      <div className="text-2xl mb-1">{uc.icon}</div>
                      <div className={`text-sm font-medium ${selected ? "text-[#2552ca]" : "text-slate-700"}`}>
                        {isArabic ? uc.ar : uc.en}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                  {t("رجوع", "Back")}
                </button>
                <button onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl text-white font-semibold power-gradient btn-glow hover:opacity-90 transition-all">
                  {t("التالي", "Next")}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Optional phone */}
          {step === 3 && (
            <motion.div key="s3"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="glass-card rounded-3xl p-8 space-y-6"
            >
              <div className="text-4xl text-center">📱</div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {t("تذكيرات واتساب", "WhatsApp Reminders")}
                </h2>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                  {t(
                    "أضف رقم واتساب لتلقي تذكيراتك مباشرةً على هاتفك. (اختياري)",
                    "Add your WhatsApp number to receive reminders directly on your phone. (optional)"
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  {t("رقم الواتساب (اختياري)", "WhatsApp number (optional)")}
                </label>
                <div className="flex gap-2">
                  <div className="px-3 py-3 bg-slate-100 rounded-xl text-slate-600 text-sm font-mono">+966</div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="5XXXXXXXX"
                    maxLength={9}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2552ca]/30 text-slate-800 font-mono"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {t(
                    "لن يُستخدم رقمك إلا للتذكيرات التي تطلبها",
                    "Your number will only be used for reminders you request"
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                  {t("رجوع", "Back")}
                </button>
                <button onClick={() => setStep(4)}
                  className="flex-1 py-3 rounded-xl text-white font-semibold power-gradient btn-glow hover:opacity-90 transition-all">
                  {phone.trim() ? t("التالي", "Next") : t("تخطي", "Skip")}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: All set */}
          {step === 4 && (
            <motion.div key="s4"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="glass-card rounded-3xl p-8 text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className="text-6xl"
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-800">
                {t("كل شيء جاهز!", "You're all set!")}
              </h2>
              <p className="text-slate-500 leading-relaxed">
                {t(
                  "تم إنشاء مشروعك الأول. ابدأ بإضافة مهامك أو حدّث مع مساعد الذكاء الاصطناعي.",
                  "Your first project is ready. Start adding tasks or chat with your AI assistant."
                )}
              </p>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-start">
                {selectedUseCases.slice(0, 3).map(id => {
                  const uc = USE_CASES.find(u => u.id === id)
                  if (!uc) return null
                  return (
                    <div key={id} className="flex items-center gap-2 text-sm text-slate-600">
                      <span>{uc.icon}</span>
                      <span>{isArabic ? uc.ar : uc.en}</span>
                      <span className="text-[#2552ca] mr-auto">✓</span>
                    </div>
                  )
                })}
                {phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>📱</span>
                    <span>{t("تذكيرات واتساب مفعّلة", "WhatsApp reminders enabled")}</span>
                    <span className="text-[#2552ca] mr-auto">✓</span>
                  </div>
                )}
              </div>
              <button onClick={finish} disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold power-gradient btn-glow hover:opacity-90 transition-all disabled:opacity-60">
                {loading
                  ? t("جاري التحضير...", "Setting up...")
                  : t("ابدأ استخدام ذكرني ←", "Start using Thakirni →")
                }
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
