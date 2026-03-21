import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "سياسة الاسترداد | Refund Policy",
  description:
    "سياسة استرداد الأموال في ذكرني — ضمان استرداد ١٤ يوم بدون أسئلة. Thakirni refund policy — 14-day money-back guarantee.",
}

export default function RefundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
