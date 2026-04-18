import type { Metadata } from "next"
import { LandingPageNew } from "@/components/thakirni/landing-page-new"

export const metadata: Metadata = {
  title: "ذكّرني | Thakirni – مساعدك الذكي الشخصي",
  description:
    "ذكّرني هو أول مساعد ذكي شخصي وذاكرة ثانية مدعومة بالذكاء الاصطناعي في السعودية. رؤية ٢٠٣٠، عام الذكاء الاصطناعي ٢٠٢٦. The first AI-powered personal assistant built for Saudi Arabia — aligned with Vision 2030 and SDAIA.",
  keywords: ["Vision 2030", "رؤية 2030", "ذكاء اصطناعي", "SDAIA", "Year of AI 2026", "عام الذكاء الاصطناعي", "Saudi AI", "ذكرني", "Thakirni"],
  alternates: { canonical: "https://thakirni.com" },
  openGraph: {
    title: "ذكّرني | Thakirni – خل ذكّرني يرتب يومك 👀",
    description: "قل اللي بخاطرك… والباقي علينا. مدعوم برؤية ٢٠٣٠.",
    url: "https://thakirni.com",
  },
}

export default function Home() {
  return <LandingPageNew />
}
