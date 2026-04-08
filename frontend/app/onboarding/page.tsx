"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/components/language-provider"

const STEPS = 5

const USE_CASES = [
  { id: "goals",     ar: "تحقيق الأهداف",         en: "Achieve goals",      icon: "🎯" },
  { id: "habits",    ar: "بناء عادات يومية",       en: "Build daily habits", icon: "🔄" },
  { id: "tasks",     ar: "تنظيم المهام",            en: "Organize tasks",     icon: "✅" },
  { id: "meetings",  ar: "تلخيص الاجتماعات",       en: "Summarize meetings", icon: "🎙️" },
  { id: "reminders", ar: "تذكيرات ذكية",            en: "Smart reminders",    icon: "⏰" },
  { id: "notes",     ar: "حفظ الأفكار والملاحظات", en: "Save notes & ideas", icon: "📝" },
]

interface QuickCreateResult {
  type: "task" | "reminder" | "note"
  emoji: string
  titleAr: string
  titleEn: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const { t, isArabic } = useLanguage()
  const [step, setStep] = useState(1)
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([])
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [createdItem, setCreatedItem] = useState<QuickCreateResult | null>(null)
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  const progress = ((step - 1) / (STEPS - 1)) * 100

  function toggleUseCase(id: string) {
    setSelectedUseCases(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    )
  }

  // Step 4: auto-trigger quick-create when user arrives
  useEffect(() => {
    if (step === 4 && !createdItem && !creating) {
      triggerQuickCreate()
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  async function triggerQuickCreate() {
    setCreating(true)
    try {
      const res = await fetch("/api/onboarding/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCases: selectedUseCases, isArabic }),
      })
      if (res.ok) {
        const data = await res.json()
        setCreatedItem(data.result ?? null)
      }
    } catch {
      // Non-fatal — user still proceeds
    } finally {
      setCreating(false)
    }
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

      if (name.trim()) {
        await supabase.from("profiles")
          .update({ full_name: name.trim() })
          .eq("id", user.id)
      }

      // Log use-case selection for activation tracking
      fetch("/api/onboarding/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCases: selectedUseCases }),
      }).catch(() => {})

      supabase.from("analytics_events").insert({
        user_id: user.id,
        event_name: "onboarding_completed",
        properties: { use_cases: selectedUseCases, has_phone: !!phone },
      }).then(() => {})

      if (phone.trim()) {
        fetch("/api/whatsapp/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone.trim(), name, useCases: selectedUseCases }),
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
    try { await markOnboarded() } catch {}
    router.push("/vault")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12" dir={isArabic ? "rtl" : "ltr"}>
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
            style={{ background: "linear-gradient(135deg, #D97706 0%, #FBBF24 100%)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">

          {/* Step 1: Welcome + name */}
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
                {t("سنرتب لك أول شي خلال دقيقتين.", "We'll set up your first item in under 2 minutes.")}
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 text-slate-800"
                />
              </div>
              <button onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl text-white font-semibold power-gradient btn-glow transition-all hover:opacity-90">
                {t("هيا نبدأ! →", "Let's go! →")}
              </button>
            </motion.div>
          )}

          {/* Step 2: Use case */}
          {step === 2 && (
            <motion.div key="s2"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="glass-card rounded-3xl p-8 space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {t("وش تبغاني أساعدك فيه؟ 👀", "What do you need help with? 👀")}
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
                          ? "border-amber-600 bg-amber-600/5"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}>
                      <div className="text-2xl mb-1">{uc.icon}</div>
                      <div className={`text-sm font-medium ${selected ? "text-amber-600 dark:text-amber-400" : "text-slate-700"}`}>
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

          {/* Step 3: Phone */}
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
                    "أضف رقمك وأرسل لك ملخص يومك كل صباح مباشرة على واتساب. (اختياري)",
                    "Add your number and I'll send your daily briefing straight to WhatsApp. (optional)"
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
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 text-slate-800 font-mono"
                  />
                </div>
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

          {/* Step 4: AHA MOMENT — auto-create first item */}
          {step === 4 && (
            <motion.div key="s4"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="glass-card rounded-3xl p-8 text-center space-y-6"
            >
              {creating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="text-5xl mx-auto w-fit"
                  >
                    ⚙️
                  </motion.div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {t("جاري أرتب لك أول شي...", "Setting up your first item...")}
                  </h2>
                  <p className="text-slate-500 text-sm">
                    {t("ثانية واحدة 👌", "One moment 👌")}
                  </p>
                </>
              ) : createdItem ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 200 }}
                    className="text-6xl"
                  >
                    {createdItem.emoji}
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      {t("خلصنا أول شي لك 👍", "Done — your first item is ready 👍")}
                    </h2>
                    <p className="text-amber-600 dark:text-amber-400 font-semibold mt-2">
                      {isArabic ? createdItem.titleAr : createdItem.titleEn}
                    </p>
                  </div>
                  <div className="bg-amber-600/5 border border-amber-600/15 rounded-2xl p-4 text-sm text-slate-600 leading-relaxed">
                    {t(
                      "تقدر تعدله، تكمله، أو تضيف المزيد — أنا موجود لما تحتاجني 👌",
                      "You can edit it, complete it, or add more — I'm here when you need me 👌"
                    )}
                  </div>
                  <button onClick={() => setStep(5)}
                    className="w-full py-3 rounded-xl text-white font-semibold power-gradient btn-glow hover:opacity-90 transition-all">
                    {t("ممتاز، كمل →", "Nice, continue →")}
                  </button>
                </>
              ) : (
                // Fallback if quick-create failed
                <>
                  <div className="text-5xl">✅</div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {t("حسابك جاهز!", "Your account is ready!")}
                  </h2>
                  <button onClick={() => setStep(5)}
                    className="w-full py-3 rounded-xl text-white font-semibold power-gradient btn-glow hover:opacity-90 transition-all">
                    {t("كمل →", "Continue →")}
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* Step 5: All set */}
          {step === 5 && (
            <motion.div key="s5"
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
                  "مساعدك الذكي جاهز. راسله متى ما احتجت وأعطيه أوامرك.",
                  "Your AI assistant is ready. Text it whenever you need and give it instructions."
                )}
              </p>

              {/* Quick-action hints */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-start">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  {t("جرب قول:", "Try saying:")}
                </p>
                {isArabic ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="bg-amber-600/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg text-xs font-mono">وش عندي اليوم؟</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="bg-amber-600/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg text-xs font-mono">ذكرني بالموعد الساعة 4</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="bg-amber-600/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg text-xs font-mono">رتب لي يومي</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="bg-amber-600/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg text-xs font-mono">What do I have today?</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="bg-amber-600/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg text-xs font-mono">Remind me at 4pm</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="bg-amber-600/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg text-xs font-mono">Plan my day</span>
                    </div>
                  </>
                )}
              </div>

              {phone && (
                <div className="flex items-center gap-2 justify-center text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2">
                  <span>📱</span>
                  <span>{t("واتساب مفعّل — ستصلك رسالة الصبح كل يوم", "WhatsApp enabled — you'll get a morning briefing daily")}</span>
                </div>
              )}

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
