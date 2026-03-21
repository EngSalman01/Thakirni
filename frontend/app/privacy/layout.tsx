import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "سياسة الخصوصية | Privacy Policy",
  description:
    "اقرأ سياسة خصوصية ذكرني — كيف نجمع بياناتك ونستخدمها ونحميها. Read Thakirni's privacy policy.",
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
