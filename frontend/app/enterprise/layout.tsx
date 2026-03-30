import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ذكرني للمؤسسات | Thakirni Enterprise",
  description: "حل الذكاء الاصطناعي المخصص لفرق العمل والشركات في المملكة العربية السعودية. احجز عرضاً توضيحياً مجانياً.",
  robots: { index: true, follow: true },
}

export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
