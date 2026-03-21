import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "الشروط والأحكام | Terms of Service",
  description:
    "شروط وأحكام استخدام منصة ذكرني. Read Thakirni's terms of service.",
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
