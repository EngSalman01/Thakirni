"use client"

import { useState, useRef } from "react"
import { VaultSidebar } from "@/components/thakirni/vault-sidebar"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mic, Upload, Clock, Users, FileText, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useMeetings } from "@/hooks/use-meetings"

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error("يجب تسجيل الدخول أولاً"); return }

      const formData = new FormData()
      formData.append("audio", file)
      formData.append("title", file.name.replace(/\.[^.]+$/, ""))
      formData.append("language", "ar")

      setUploadProgress(30)
      toast.info("جاري معالجة التسجيل... قد يستغرق بضع دقائق")

      const res = await fetch(`${API_URL}/api/meetings/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      })

      setUploadProgress(90)
      const data = await res.json() as { error?: string; meeting?: { id: string } }

      if (!res.ok) {
        if (res.status === 403) {
          toast.error("ملخص الاجتماعات متاح لمشتركي Pro أو أعلى", { action: { label: "ترقية", onClick: () => window.location.href = "/pricing" } })
        } else {
          toast.error(data.error ?? "فشل في معالجة التسجيل")
        }
        return
      }

      setUploadProgress(100)
      toast.success("تم تحليل الاجتماع بنجاح! ✅")
      mutate()
    } catch (err) {
      toast.error("حدث خطأ أثناء الرفع")
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
    toast.success("تم حذف الاجتماع")
    mutate()
  }

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${String(s).padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      <main className="lg:ml-72 pt-16 p-4 md:p-6 lg:pt-4 transition-all duration-300">
      <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Mic className="w-6 h-6 text-[#2552ca]" />
          ملخص الاجتماعات
        </h1>
        <p className="text-muted-foreground text-sm">
          ارفع تسجيل اجتماعك — الذكاء الاصطناعي يحلله ويعطيك ملخصاً مع تحديد المتحدثين
        </p>
      </div>

      {/* Upload Card */}
      <Card className="mb-6 border-dashed border-2 border-[#2552ca]/30 bg-[#2552ca]/5">
        <CardContent className="p-8 text-center">
          <div
            className="cursor-pointer"
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2552ca] to-[#fd65c2] flex items-center justify-center mx-auto mb-4">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <p className="font-semibold text-lg mb-1">ارفع تسجيل الاجتماع</p>
            <p className="text-muted-foreground text-sm mb-4">
              MP3، WAV، M4A، MP4، WebM — حتى 100MB
            </p>
            <Button
              disabled={isUploading}
              style={{ background: "linear-gradient(135deg, #2552ca, #fd65c2)" }}
              className="text-white border-0"
            >
              {isUploading ? "جاري التحليل..." : "اختر ملف"}
            </Button>
          </div>

          {isUploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {uploadProgress < 30 ? "جاري الرفع..." : uploadProgress < 90 ? "جاري تحليل المتحدثين وإنشاء الملخص..." : "اكتمل التحليل!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/mp4,video/webm"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Meetings List */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">اجتماعاتك ({meetings.length})</h2>

        {meetings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا يوجد اجتماعات بعد</p>
              <p className="text-sm">ارفع أول تسجيل لك أعلاه</p>
            </CardContent>
          </Card>
        ) : (
          (meetings as unknown as Meeting[]).map((m) => (
            <Card key={m.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold truncate">{m.title}</CardTitle>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {m.duration_seconds && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(m.duration_seconds!)}
                        </span>
                      )}
                      {m.speaker_count && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {m.speaker_count!} متحدث
                        </span>
                      )}
                      <span className="text-xs">
                        {new Date(m.created_at).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={m.status === "completed" ? "default" : "secondary"} className="text-xs">
                      {m.status === "completed" ? "مكتمل" : "جاري..."}
                    </Badge>
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
              </CardHeader>

              {/* Summary preview */}
              {m.summary && (
                <CardContent className="pt-0 pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{m.summary!}</p>
                </CardContent>
              )}

              {/* Expanded detail */}
              {expandedId === (m.id) && (
                <CardContent className="pt-0 border-t bg-muted/30">
                  {/* Speakers */}
                  {m.speakers && Object.keys(m.speakers as Record<string,string>).length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> المتحدثون
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(m.speakers as Record<string,string>).map(([key, name]) => (
                          <Badge key={key} variant="outline">{name !== key ? `${name} (${key})` : key}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key points */}
                  {Array.isArray(m.key_points) && (m.key_points as string[]).length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2">📌 النقاط الرئيسية</h4>
                      <ul className="space-y-1">
                        {(m.key_points as string[]).map((pt, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-[#2552ca] mt-0.5">•</span> {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action items */}
                  {Array.isArray(m.action_items) && (m.action_items as string[]).length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2">✅ مهام للمتابعة</h4>
                      <ul className="space-y-1">
                        {(m.action_items as string[]).map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">→</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Full summary */}
                  {m.summary && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" /> الملخص الكامل
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{m.summary!}</p>
                    </div>
                  )}

                  {/* Transcript excerpt */}
                  {Array.isArray(m.transcript) && ((m.transcript ?? []) as NonNullable<Meeting["transcript"]>).length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2">📝 النص الكامل (أول ١٠ قطع)</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {((m.transcript ?? []) as NonNullable<Meeting["transcript"]>).slice(0, 10).map((seg, i) => (
                          <div key={i} className="text-sm flex gap-2">
                            <span className="text-[#2552ca] font-medium flex-shrink-0 w-24">
                              {seg.speaker as string ?? `قطعة ${i + 1}`}:
                            </span>
                            <span className="text-muted-foreground">{seg.text as string}</span>
                          </div>
                        ))}
                        {(m.transcript as unknown[]).length > 10 && (
                          <p className="text-xs text-muted-foreground">... و {(m.transcript as unknown[]).length - 10} قطعة أخرى</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
      </main>
    </div>
  )
}
