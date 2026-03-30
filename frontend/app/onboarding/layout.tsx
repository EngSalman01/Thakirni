import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "الإعداد | Setup — Thakirni",
  robots: { index: false, follow: false },
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
