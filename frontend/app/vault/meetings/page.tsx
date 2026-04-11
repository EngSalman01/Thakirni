"use client"

import { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mic, Upload, Clock, Users, FileText, ChevronDown, ChevronUp, Trash2, Sparkles } from "lucide-react"
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

function ParticleLayer() {
  useEffect(() => {
    const container = document.getElementById("meetings-particles")
    if (!container || container.childElementCount > 0) return
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div")
      p.style.cssText = `
        position:absolute;width:${4+Math.random()*6}px;height:${4+Math.random()*6}px;
        border-radius:50%;opacity:${0.06+Math.random()*0.12};
        left:${Math.random()*100}%;top:${Math.random()*100}%;
        background:${Math.random()>0.5?"#D97706":"#F59E0B"};
        --drift-x:${(Math.random()-0.5)*120}px;--drift-y:${(Math.random()-0.5)*120}px;
        animation:particle-drift ${8+Math.random()*12}s ease-in-out infinite;
        animation-delay:${-Math.random()*15}s;pointer-events:none;
      `
      container.appendChild(p)
    }
  }, [])
  return <div id="meetings-particles" className="absolute inset-0 overflow-hidden pointer-events-none" />
}

function MeetingVisual({ t, latestMeeting }: {
  t: (a: string, b: string) => string;
  latestMeeting?: Record<string, unknown> | null;
}) {
  type Meeting = { title?: string; duration_seconds?: number; speaker_count?: number; action_items?: string[] };
  const meeting = latestMeeting as Meeting | null | undefined;

  function fmtDuration(secs: number) {
    const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.2, 1, 0.3, 1] }}
        className="relative bg-card rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-border"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl power-gradient flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-bold text-foreground text-sm truncate">
              {meeting ? String(meeting.title ?? t("اجتماع", "Meeting")) : t("لا اجتماعات بعد", "No meetings yet")}
            </p>
            <p className="text-xs text-muted-foreground">
              {meeting
                ? `${meeting.duration_seconds ? fmtDuration(Number(meeting.duration_seconds)) : "--"} • ${meeting.speaker_count ?? 1} ${t("متحدث", "speakers")}`
                : t("ارفع تسجيلاً للبدء", "Upload a recording to start")}
            </p>
          </div>
          {meeting && <span className="ms-auto text-xs font-bold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full shrink-0">{t("مكتمل", "Done")}</span>}
        </div>

        {/* Summary lines or empty state */}
        {meeting ? (
          <div className="space-y-2 mb-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("الملخص", "Summary")}</p>
            {[100, 85, 65].map((w, i) => (
              <motion.div key={i} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                className="h-2 bg-[#e4e2e1] rounded-full origin-left" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400">
            <Mic className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">{t("سجّل اجتماعك وتلقّ ملخصاً ذكياً فورياً", "Record a meeting and get an instant AI summary")}</p>
          </div>
        )}

        {/* Action items (only when meeting exists and has items) */}
        {meeting && Array.isArray(meeting.action_items) && meeting.action_items.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("مهام للمتابعة", "Action Items")}</p>
            {meeting.action_items.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] border-2 border-border" />
                {item}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Floating AI badge */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-lg border border-border px-4 py-2 flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-bold text-foreground">{t("تحليل ذكي", "AI Analysis")}</span>
      </motion.div>

      {/* Floating speaker badge (only when meeting exists) */}
      {meeting && (
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-lg border border-border px-4 py-2 flex items-center gap-2"
        >
          <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-bold text-foreground">{meeting.speaker_count ?? 1} {t("متحدث", "speakers")}</span>
        </motion.div>
      )}
    </div>
  )
}

export default function MeetingsPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { meetings, mutate, isLoading: meetingsLoading, isError: meetingsError } = useMeetings()
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
      const res = await fetch(`/api/meetings/upload`, {
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
    } catch (err) {
      console.error("[Meetings] upload error:", err)
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
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success(t("تم حذف الاجتماع", "Meeting deleted"))
      mutate()
    } catch (err) {
      console.error("[Meetings] delete error:", err)
      toast.error(t("فشل حذف الاجتماع", "Failed to delete meeting"))
    }
  }

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${String(s).padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-background hero-mesh overflow-x-hidden">
      <main className="pt-14 lg:pt-16 transition-all duration-300">

        {/* ═══ HERO ═══ */}
        <section className="relative pt-32 pb-24 px-8 overflow-hidden">
          <ParticleLayer />
          <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.2, 1, 0.3, 1] }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-amber-600/20 rounded-full px-4 py-2 mb-8 shadow-sm">
                <Mic className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-label font-medium text-muted-foreground">{t("تحليل بالذكاء الاصطناعي", "AI-Powered Analysis")}</span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight leading-none mb-8">
                <span className="text-foreground">{t("حوّل", "Turn")}</span>{" "}
                <span className="gradient-text">{t("اجتماعاتك", "Meetings")}</span>
                <br />
                <span className="text-foreground">{t("إلى رؤى", "Into Insights")}</span>
              </h1>

              <p className="text-xl text-muted-foreground font-body mb-10 leading-relaxed max-w-lg">
                {t(
                  "ارفع أي تسجيل صوتي أو مرئي واحصل على ملخص فوري، نقاط رئيسية، مهام للمتابعة وتحليل المتحدثين.",
                  "Upload any audio or video recording and instantly get a summary, key points, action items, and speaker analysis."
                )}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl power-gradient text-white font-bold text-lg btn-glow shadow-lg disabled:opacity-60 disabled:pointer-events-none"
                >
                  <Upload className="w-5 h-5" />
                  {isUploading ? t("جاري التحليل...", "Analysing...") : t("ارفع تسجيلاً", "Upload Recording")}
                </motion.button>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  MP3, WAV, M4A, MP4, WebM
                </div>
              </div>

              {isUploading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-card rounded-2xl p-5 border border-border shadow-card">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-label font-medium text-muted-foreground">
                      {uploadProgress < 30 ? t("جاري الرفع...", "Uploading...") : uploadProgress < 90 ? t("جاري التحليل...", "Analysing...") : t("اكتمل!", "Complete!")}
                    </span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </motion.div>
              )}
            </motion.div>

            {/* Right visual */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 1, 0.3, 1] }}
              className="flex items-center justify-center">
              <MeetingVisual t={t} latestMeeting={meetings[0] ?? null} />
            </motion.div>
          </div>
        </section>

        <input ref={fileInputRef} type="file" accept="audio/*,video/mp4,video/webm" className="hidden" onChange={handleFileUpload} />

        {/* ═══ MEETINGS LIST ═══ */}
        <section className="px-8 pb-24">
          <div className="max-w-7xl mx-auto">

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0 }} transition={{ duration: 0.6 }}
              className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-headline font-extrabold text-foreground">
                  {t("اجتماعاتك", "Your Meetings")}
                </h2>
                <p className="text-muted-foreground mt-1">{t(`${meetings.length} تسجيل محفوظ`, `${meetings.length} saved recording${meetings.length !== 1 ? "s" : ""}`)}</p>
              </div>
            </motion.div>

            {meetingsError ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center">
                <p className="text-red-600 font-semibold mb-3">{t("فشل تحميل الاجتماعات", "Failed to load meetings")}</p>
                <Button variant="outline" size="sm" onClick={() => mutate()} className="text-red-600 border-red-300 hover:bg-red-50">
                  {t("إعادة المحاولة", "Retry")}
                </Button>
              </motion.div>
            ) : meetingsLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="bg-muted dark:bg-white/[0.03] rounded-2xl h-28 animate-pulse" />)}
              </div>
            ) : meetings.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-muted dark:bg-white/[0.03] rounded-2xl p-16 text-center">
                <div className="w-20 h-20 rounded-3xl power-gradient flex items-center justify-center mx-auto mb-6 opacity-30">
                  <Mic className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-muted-foreground mb-2">{t("ما عندك اجتماعات للحين 🎙️", "No meetings yet")}</h3>
                <p className="text-muted-foreground">{t("ارفع تسجيل ونرتب لك كل شي بالذكاء الاصطناعي", "Upload a recording and we'll organize everything with AI")}</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {(meetings as unknown as Meeting[]).map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.5 }}
                    className="bg-muted dark:bg-white/[0.03] rounded-2xl overflow-hidden hover-lift"
                  >
                    {/* Colored top stripe */}
                    <div className="h-1.5 w-full power-gradient" />

                    <div className="p-8">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl power-gradient flex items-center justify-center shrink-0 shadow-lg shadow-amber-600/20">
                            <Mic className="w-6 h-6 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xl font-headline font-bold text-foreground truncate">{m.title}</h3>
                            <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground flex-wrap">
                              {m.duration_seconds && (
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatDuration(m.duration_seconds!)}
                                </span>
                              )}
                              {m.speaker_count && (
                                <span className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5" />
                                  {t(`${m.speaker_count!} متحدث`, `${m.speaker_count!} speaker${m.speaker_count !== 1 ? "s" : ""}`)}
                                </span>
                              )}
                              <span>{new Date(m.created_at).toLocaleDateString(isArabic ? "ar-SA" : "en-US")}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${m.status === "completed" ? "bg-green-100 text-green-700" : "bg-[#e4e2e1] text-muted-foreground"}`}>
                            {m.status === "completed" ? t("مكتمل", "Completed") : t("جاري...", "Processing...")}
                          </span>
                          <Button variant="ghost" size="icon" aria-label="Delete meeting" className="h-9 w-9 text-slate-400 hover:text-red-500" onClick={() => handleDelete(m.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Toggle details" className="h-9 w-9 text-slate-400" onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}>
                            {expandedId === m.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      {m.summary && (
                        <p className="text-muted-foreground text-sm mt-4 line-clamp-2 leading-relaxed">{m.summary}</p>
                      )}
                    </div>

                    {/* Expanded detail */}
                    {expandedId === m.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border bg-card p-8 space-y-6">
                        {/* Speakers */}
                        {m.speakers && Object.keys(m.speakers as Record<string, string>).length > 0 && (
                          <div>
                            <h4 className="font-headline font-bold text-foreground mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" /> {t("المتحدثون", "Speakers")}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(m.speakers as Record<string, string>).map(([key, name]) => (
                                <Badge key={key} variant="outline" className="bg-muted dark:bg-white/[0.03] border-border text-muted-foreground">{name !== key ? `${name} (${key})` : key}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Key points */}
                        {Array.isArray(m.key_points) && (m.key_points as string[]).length > 0 && (
                          <div>
                            <h4 className="font-headline font-bold text-foreground mb-3">📌 {t("النقاط الرئيسية", "Key Points")}</h4>
                            <ul className="space-y-2">
                              {(m.key_points as string[]).map((pt, i) => (
                                <li key={i} className="text-muted-foreground flex items-start gap-2 text-sm">
                                  <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span> {pt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action items */}
                        {Array.isArray(m.action_items) && (m.action_items as string[]).length > 0 && (
                          <div>
                            <h4 className="font-headline font-bold text-foreground mb-3">✅ {t("مهام للمتابعة", "Action Items")}</h4>
                            <ul className="space-y-2">
                              {(m.action_items as string[]).map((item, i) => (
                                <li key={i} className="text-muted-foreground flex items-start gap-2 text-sm">
                                  <span className="text-green-600 font-bold mt-0.5">→</span> {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Full summary */}
                        {m.summary && (
                          <div className="bg-muted dark:bg-white/[0.03] rounded-2xl p-6 border-s-4 border-amber-600">
                            <h4 className="font-headline font-bold text-foreground mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" /> {t("الملخص الكامل", "Full Summary")}
                            </h4>
                            <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">{m.summary}</p>
                          </div>
                        )}

                        {/* Transcript */}
                        {Array.isArray(m.transcript) && ((m.transcript ?? []) as NonNullable<Meeting["transcript"]>).length > 0 && (
                          <div>
                            <h4 className="font-headline font-bold text-foreground mb-3">📝 {t("النص الكامل (أول ١٠ قطع)", "Full Transcript (first 10 segments)")}</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto bg-muted dark:bg-white/[0.03] rounded-2xl p-5 border border-border">
                              {((m.transcript ?? []) as NonNullable<Meeting["transcript"]>).slice(0, 10).map((seg, i) => (
                                <div key={i} className="text-sm flex gap-3">
                                  <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0 w-24">
                                    {seg.speaker as string ?? (isArabic ? `قطعة ${i + 1}` : `Segment ${i + 1}`)}:
                                  </span>
                                  <span className="text-muted-foreground">{seg.text as string}</span>
                                </div>
                              ))}
                              {(m.transcript as unknown[]).length > 10 && (
                                <p className="text-xs text-slate-400 text-center pt-2">
                                  {t(`... و ${(m.transcript as unknown[]).length - 10} قطعة أخرى`, `... and ${(m.transcript as unknown[]).length - 10} more segments`)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
