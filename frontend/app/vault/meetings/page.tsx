"use client"

import { useState, useRef } from "react"
import { VaultSidebar, MobileMenuButton } from "@/components/thakirni/vault-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mic, Upload, Clock, Users, FileText, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useMeetings } from "@/hooks/use-meetings"
import { motion } from "framer-motion"

interface Meeting {
  id: string
  title: string
  duration_seconds?: number
  speaker_count?: number
  language?: string
  summary?: string
  key_points?: string[]
  action_items?: string[]
  speakers?: Record<string, string>
  transcript?: Array<{ id: number; start: number; end: number; text: string; speaker?: string }>
  status: string
  created_at: string
}

const API_URL = ""

export default function MeetingsPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { meetings, mutate } = useMeetings()
  const { t, isArabic } = useLanguage()

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error(t("يجب تسجيل الدخول أولاً", "Please sign in first")); return }

      const formData = new FormData()
      formData.append("audio", file)
      formData.append("title", file.name.replace(/\.[^.]+$/, ""))
      formData.append("language", isArabic ? "ar" : "en")

      setUploadProgress(30)
      toast.info(t("جاري معالجة التسجيل... قد يستغرق بضع دقائق", "Processing recording... this may take a few minutes"))

      const res = await fetch(`${API_URL}/api/meetings/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      })

      setUploadProgress(90)
      const data = await res.json() as { error?: string; meeting?: { id: string } }

      if (!res.ok) {
        if (res.status === 403) {
          toast.error(
            t("ملخص الاجتماعات متاح لمشتركي Pro أو أعلى", "Meeting summaries require a Pro subscription or higher"),
            { action: { label: t("ترقية", "Upgrade"), onClick: () => window.location.href = "/pricing" } }
          )
        } else {
          toast.error(data.error ?? t("فشل في معالجة التسجيل", "Failed to process recording"))
        }
        return
      }

      setUploadProgress(100)
      toast.success(t("تم تحليل الاجتماع بنجاح! ✅", "Meeting analysed successfully! ✅"))
      mutate()
    } catch {
      toast.error(t("حدث خطأ أثناء الرفع", "An error occurred during upload"))
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch(`${API_URL}/api/meetings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    toast.success(t("تم حذف الاجتماع", "Meeting deleted"))
    mutate()
  }

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${String(s).padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-[#fbf9f8] hero-mesh overflow-x-hidden">
      <VaultSidebar />

      {/* Fixed glassmorphism header — desktop */}
      <header className="fixed top-0 left-72 right-0 z-30 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 h-20 shadow-ambient hidden lg:flex border-b border-white/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#385b9b] to-[#2552ca] flex items-center justify-center shadow-lg shadow-[#2552ca]/30">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-headline font-extrabold gradient-text">{t("ملخص الاجتماعات", "Meeting Summaries")}</span>
            <p className="text-xs text-slate-500">{t("ارفع تسجيلاتك وحللها بالذكاء الاصطناعي", "Upload recordings and analyse with AI")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle /><LanguageToggle />
        </div>
      </header>

      <main className="lg:ml-72 pt-4 lg:pt-24 px-4 sm:px-6 lg:px-8 pb-16 transition-all duration-300">
        {/* Mobile header */}
        <div className="flex items-center gap-3 mb-6 lg:hidden">
          <MobileMenuButton />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#385b9b] to-[#2552ca] flex items-center justify-center shadow-lg shadow-[#2552ca]/30">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-headline font-extrabold gradient-text">{t("ملخص الاجتماعات", "Meeting Summaries")}</span>
              <p className="text-xs text-slate-500">{t("حلل تسجيلاتك", "Analyse your recordings")}</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">

          {/* Upload Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border-2 border-dashed border-[#2552ca]/30 shadow-ambient p-10 text-center cursor-pointer hover-lift"
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#385b9b] to-[#2552ca] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#2552ca]/30">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <p className="font-headline font-bold text-lg text-slate-900 mb-1">
              {t("ارفع تسجيل الاجتماع", "Upload Meeting Recording")}
            </p>
            <p className="text-slate-500 text-sm mb-5">
              {t("MP3، WAV، M4A، MP4، WebM — حتى 100MB", "MP3, WAV, M4A, MP4, WebM — up to 100MB")}
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              disabled={isUploading}
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full power-gradient text-white font-bold text-sm btn-glow disabled:opacity-60 disabled:pointer-events-none"
            >
              {isUploading ? t("جاري التحليل...", "Analysing...") : t("اختر ملف", "Choose File")}
            </motion.button>

            {isUploading && (
              <div className="mt-5">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-slate-500 mt-2">
                  {uploadProgress < 30
                    ? t("جاري الرفع...", "Uploading...")
                    : uploadProgress < 90
                      ? t("جاري تحليل المتحدثين وإنشاء الملخص...", "Analysing speakers and generating summary...")
                      : t("اكتمل التحليل!", "Analysis complete!")}
                </p>
              </div>
            )}
          </motion.div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/mp4,video/webm"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Meetings List */}
          <div className="space-y-4">
            <h2 className="font-headline font-bold text-slate-900">
              {t(`اجتماعاتك (${meetings.length})`, `Your Meetings (${meetings.length})`)}
            </h2>

            {meetings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl border border-white/40 shadow-ambient p-12 text-center"
              >
                <Mic className="w-12 h-12 mx-auto mb-3 text-[#2552ca]/30" />
                <p className="font-headline font-bold text-slate-700">{t("لا يوجد اجتماعات بعد", "No meetings yet")}</p>
                <p className="text-sm text-slate-500">{t("ارفع أول تسجيل لك أعلاه", "Upload your first recording above")}</p>
              </motion.div>
            ) : (
              (meetings as unknown as Meeting[]).map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-[#e4e2e1] shadow-ambient hover-lift overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-headline font-bold text-slate-900 text-base truncate">{m.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          {m.duration_seconds && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDuration(m.duration_seconds!)}
                            </span>
                          )}
                          {m.speaker_count && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {t(`${m.speaker_count!} متحدث`, `${m.speaker_count!} speaker${m.speaker_count !== 1 ? "s" : ""}`)}
                            </span>
                          )}
                          <span className="text-xs">
                            {new Date(m.created_at).toLocaleDateString(isArabic ? "ar-SA" : "en-US")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${m.status === "completed" ? "bg-green-100 text-green-700" : "bg-[#f0eded] text-slate-500"}`}>
                          {m.status === "completed" ? t("مكتمل", "Completed") : t("جاري...", "Processing...")}
                        </span>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(m.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => setExpandedId(expandedId === (m.id) ? null : (m.id))}
                        >
                          {expandedId === (m.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Summary preview */}
                    {m.summary && (
                      <p className="text-sm text-slate-500 line-clamp-2 mt-3">{m.summary!}</p>
                    )}
                  </div>

                  {/* Expanded detail */}
                  {expandedId === (m.id) && (
                    <div className="border-t border-[#e4e2e1] bg-[#f6f3f2] p-5 space-y-4">
                      {/* Speakers */}
                      {m.speakers && Object.keys(m.speakers as Record<string,string>).length > 0 && (
                        <div>
                          <h4 className="font-headline font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-[#2552ca]" /> {t("المتحدثون", "Speakers")}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(m.speakers as Record<string,string>).map(([key, name]) => (
                              <Badge key={key} variant="outline" className="bg-white border-[#e4e2e1]">{name !== key ? `${name} (${key})` : key}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key points */}
                      {Array.isArray(m.key_points) && (m.key_points as string[]).length > 0 && (
                        <div>
                          <h4 className="font-headline font-bold text-sm text-slate-900 mb-2">📌 {t("النقاط الرئيسية", "Key Points")}</h4>
                          <ul className="space-y-1">
                            {(m.key_points as string[]).map((pt, i) => (
                              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="text-[#2552ca] mt-0.5">•</span> {pt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action items */}
                      {Array.isArray(m.action_items) && (m.action_items as string[]).length > 0 && (
                        <div>
                          <h4 className="font-headline font-bold text-sm text-slate-900 mb-2">✅ {t("مهام للمتابعة", "Action Items")}</h4>
                          <ul className="space-y-1">
                            {(m.action_items as string[]).map((item, i) => (
                              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">→</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Full summary */}
                      {m.summary && (
                        <div className="bg-white rounded-xl p-4 border-l-4 border-[#2552ca]">
                          <h4 className="font-headline font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-[#2552ca]" /> {t("الملخص الكامل", "Full Summary")}
                          </h4>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap">{m.summary!}</p>
                        </div>
                      )}

                      {/* Transcript excerpt */}
                      {Array.isArray(m.transcript) && ((m.transcript ?? []) as NonNullable<Meeting["transcript"]>).length > 0 && (
                        <div>
                          <h4 className="font-headline font-bold text-sm text-slate-900 mb-2">📝 {t("النص الكامل (أول ١٠ قطع)", "Full Transcript (first 10 segments)")}</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto bg-white rounded-xl p-3 border border-[#e4e2e1]">
                            {((m.transcript ?? []) as NonNullable<Meeting["transcript"]>).slice(0, 10).map((seg, i) => (
                              <div key={i} className="text-sm flex gap-2">
                                <span className="text-[#2552ca] font-bold flex-shrink-0 w-24">
                                  {seg.speaker as string ?? (isArabic ? `قطعة ${i + 1}` : `Segment ${i + 1}`)}:
                                </span>
                                <span className="text-slate-600">{seg.text as string}</span>
                              </div>
                            ))}
                            {(m.transcript as unknown[]).length > 10 && (
                              <p className="text-xs text-slate-400">
                                {t(`... و ${(m.transcript as unknown[]).length - 10} قطعة أخرى`, `... and ${(m.transcript as unknown[]).length - 10} more segments`)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
