import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "تسجيل الدخول | Sign In",
  description:
    "سجّل دخولك أو أنشئ حساباً جديداً في ذكرني — مساعدك الذكي الشخصي. Sign in or create your Thakirni account.",
  openGraph: {
    title: "Sign In – Thakirni | تسجيل الدخول",
    description: "Join Thakirni — your AI-powered second brain.",
    url: "https://thakirni.com/auth",
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
