"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { STUDENT_TEMPLATES, type StudentTemplate } from "@/lib/student-templates"

const ease = [0.22, 1, 0.36, 1] as const

interface Props {
  userId: string
  onDone: () => void
}

export function StudentTemplateModal({ userId, onDone }: Props) {
  const { t, isArabic } = useLanguage()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function applyTemplate(template: StudentTemplate) {
    setLoading(true)
    try {
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })
      const rows = template.plans.map(p => ({
        user_id: userId,
        title: p.title,
        category: p.category,
        plan_date: today,
        status: "pending",
      }))
      await supabase.from("plans").insert(rows)
      await supabase.from("profiles").update({ "plan_tier": "student" } as Record<string, unknown>).eq("id", userId)
      onDone()
    } catch (err) {
      console.error("[StudentTemplateModal] apply error:", err)
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.35, ease }}
        className="w-full max-w-xl max-h-[85vh] overflow-y-auto bg-[#13100C] border border-amber-900/40 rounded-2xl p-6"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🎓</div>
          <h2 className="font-headline text-xl font-bold text-foreground mb-1">
            {t("اختر قالب تبدأ فيه", "Pick a template to get started")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("سيتم إضافة مهام البداية تلقائياً لك", "Starter tasks will be added to your vault automatically")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {STUDENT_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setSelected(tmpl.id)}
              className={`flex flex-col gap-2 p-4 rounded-xl border text-start transition-all duration-200 ${
                selected === tmpl.id
                  ? "border-amber-500 bg-amber-950/40"
                  : "border-amber-900/30 bg-white/[0.03] hover:border-amber-700/50"
              }`}
            >
              <span className="text-2xl">{tmpl.emoji}</span>
              <div>
                <div className="text-sm font-semibold text-foreground leading-snug">
                  {isArabic ? tmpl.nameAr : tmpl.nameEn}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {isArabic ? tmpl.descAr : tmpl.descEn}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button
            disabled={!selected || loading}
            onClick={() => {
              const tmpl = STUDENT_TEMPLATES.find(t => t.id === selected)
              if (tmpl) applyTemplate(tmpl)
            }}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white power-gradient disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? t("جاري التطبيق...", "Applying...") : t("ابدأ مع هذا القالب ✓", "Start with this template ✓")}
          </button>
          <button
            onClick={onDone}
            className="w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("تخطي", "Skip")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
