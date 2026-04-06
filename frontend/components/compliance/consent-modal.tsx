"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Shield, ExternalLink } from "lucide-react"

const CONSENT_KEY = "thakirni_consent_v1"

export function ConsentModal() {
  const [open, setOpen] = useState(false)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    // Only show if not already accepted locally
    const stored = typeof window !== "undefined" ? localStorage.getItem(CONSENT_KEY) : null
    if (stored === "accepted") return

    // Check server-side consent status
    fetch("/api/user/consent")
      .then((r) => {
        // Don't show modal for unauthenticated users (401) or any error
        if (!r.ok) return null
        return r.json() as Promise<{ consented?: boolean }>
      })
      .then((d) => {
        if (!d) return
        if (!d.consented) {
          setOpen(true)
        } else {
          // Sync to localStorage so we don't hit the API every page load
          localStorage.setItem(CONSENT_KEY, "accepted")
        }
      })
      .catch(() => {
        // Network error or unauthenticated — don't show
      })
  }, [])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const res = await fetch("/api/user/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: "1.0" }),
      })
      if (res.ok) {
        localStorage.setItem(CONSENT_KEY, "accepted")
      }
    } catch (err) {
      console.error("[ConsentModal] accept error:", err)
    } finally {
      setAccepting(false)
      // Always dismiss — consent will be re-requested on next load if the API failed
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg rounded-2xl border border-[#e4e2e1] [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-right leading-snug font-headline text-slate-900 text-base">
              موافقة على معالجة البيانات / Data Processing Consent
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Arabic */}
          <div dir="rtl" className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 space-y-2">
            <p className="font-label font-semibold text-slate-800">عزيزي المستخدم،</p>
            <p className="text-slate-600 leading-relaxed">
              تستخدم منصة <strong>ذاكرني</strong> تقنيات الذكاء الاصطناعي لمعالجة
              مدخلاتك وتحليلها بهدف تقديم خدمات التخطيط والتذكير والتحليل الشخصي.
              يتم تخزين بياناتك بأمان على خوادمنا لتمكينك من استخدام الخدمة.
            </p>
            <p className="text-slate-600 leading-relaxed">
              بموجب نظام حماية البيانات الشخصية (نظام PDPL)، يحق لك في أي وقت:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ms-2">
              <li>تصدير جميع بياناتك من صفحة الإعدادات</li>
              <li>حذف حسابك ومعه جميع بياناتك نهائياً</li>
              <li>التواصل معنا عبر support@thakirni.com</li>
            </ul>
            <p className="text-slate-500 text-xs">
              للاطلاع على سياسة الخصوصية كاملةً،{" "}
              <a href="/legal/privacy" target="_blank" rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 underline inline-flex items-center gap-1">
                اضغط هنا <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {/* English */}
          <div dir="ltr" className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 space-y-2">
            <p className="font-label font-semibold text-slate-800">Dear User,</p>
            <p className="text-slate-600 leading-relaxed">
              <strong>Thakirni</strong> uses AI to process your inputs and deliver
              planning, reminders, and personal analytics. Your data is securely
              stored to provide you with the service.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Under Saudi Arabia&apos;s PDPL, you can at any time:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
              <li>Export all your data from the Settings page</li>
              <li>Delete your account and all associated data permanently</li>
              <li>Contact us at support@thakirni.com</li>
            </ul>
            <p className="text-slate-500 text-xs">
              Read the full Privacy Policy{" "}
              <a href="/legal/privacy" target="_blank" rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 underline inline-flex items-center gap-1">
                here <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full rounded-full bg-indigo-600 hover:bg-[#1e42a8] text-white font-label font-bold py-6 text-base"
          >
            {accepting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري التسجيل...
              </span>
            ) : (
              "أوافق وأبدأ / I Agree & Continue"
            )}
          </Button>
          <p className="text-center text-xs text-slate-400 mt-3">
            يجب الموافقة على الشروط للمتابعة · Acceptance required to continue
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
