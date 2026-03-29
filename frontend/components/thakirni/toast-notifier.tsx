"use client"

import { useEffect, useRef } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"

const TOASTS = {
  email_verified: {
    ar: "تم التحقق من بريدك! أهلاً في ذكرني 🎉",
    en: "Email verified! Welcome to Thakirni 🎉",
  },
  invite_accepted: {
    ar: "أهلاً! حسابك جاهز 🎉",
    en: "Welcome! Your account is ready 🎉",
  },
  password_updated: {
    ar: "تم تحديث كلمة المرور ✅",
    en: "Password updated ✅",
  },
  email_updated: {
    ar: "تم تحديث البريد الإلكتروني ✅",
    en: "Email updated ✅",
  },
} as const

type ToastKey = keyof typeof TOASTS

export function ToastNotifier() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const shown = useRef(false)

  useEffect(() => {
    if (shown.current) return
    const key = searchParams.get("toast") as ToastKey | null
    if (!key || !TOASTS[key]) return

    shown.current = true
    const isArabic =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("language") !== "en"
        : true

    const msg = TOASTS[key]
    toast.success(isArabic ? msg.ar : msg.en, { duration: 5000 })

    // Remove ?toast= from URL without triggering a navigation
    const params = new URLSearchParams(searchParams.toString())
    params.delete("toast")
    const next = params.size > 0 ? `${pathname}?${params}` : pathname
    router.replace(next, { scroll: false })
  }, [searchParams, router, pathname])

  return null
}
