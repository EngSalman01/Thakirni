import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "الأسعار | Pricing",
  description:
    "خطط مرنة لكل طموح. مجاني، برو ٣٠ ر.س/شهر، فرق ٦٠ ر.س/مستخدم. Flexible plans for every ambition — Free, Pro 30 SAR/month, Teams 60 SAR/user.",
  openGraph: {
    title: "Thakirni Pricing | أسعار ذكرني",
    description:
      "Start free. Upgrade to Pro for 30 SAR/month. Teams at 60 SAR per user.",
    url: "https://thakirni.com/pricing",
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
