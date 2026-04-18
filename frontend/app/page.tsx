import type { Metadata } from "next"
// Atelier redesign (Phase 1). The previous landing still lives at
// `@/components/thakirni/landing-page-new` and can be restored by swapping
// the import during rollback if needed.
import { LandingPageAtelier } from "@/components/thakirni/landing-page-atelier"

export const metadata: Metadata = {
  title: "ذكّرني | Thakirni — عقلك الثاني",
  description:
    "ذكّرني — أداة هادئة تحفظ ما يهمّك وتعيده حين تحتاجه. مصنوع للعربية والإنجليزية، مواكب لرؤية 2030 وعام الذكاء الاصطناعي 2026. A quiet instrument that keeps what matters and brings it back when you need it — Arabic-first, built for Vision 2030.",
  keywords: ["Vision 2030", "رؤية 2030", "ذكاء اصطناعي", "SDAIA", "Year of AI 2026", "عام الذكاء الاصطناعي", "Saudi AI", "ذكرني", "Thakirni", "second brain", "AI atelier"],
  alternates: { canonical: "https://thakirni.com" },
  openGraph: {
    title: "Thakirni — your second brain, quietly",
    description: "A quiet AI instrument that keeps what matters and brings it back when you need it. Arabic-first. Built for Vision 2030.",
    url: "https://thakirni.com",
  },
}

export default function Home() {
  return <LandingPageAtelier />
}
