import type { Metadata } from "next"
import { LandingHeader } from "@/components/thakirni/landing-header"
import { HeroSection } from "@/components/thakirni/hero-section"
import { TrustSignals } from "@/components/thakirni/trust-signals"
import { FeaturesSection } from "@/components/thakirni/features-section"

import { PricingSection } from "@/components/thakirni/pricing-section"
import { CTASection } from "@/components/thakirni/cta-section"
import { Vision2030Section } from "@/components/thakirni/vision2030-section"
import { LandingFooter } from "@/components/thakirni/landing-footer"

export const metadata: Metadata = {
  title: "ذكّرني | Thakirni – مساعدك الذكي الشخصي",
  description:
    "ذكّرني هو أول مساعد ذكي شخصي وذاكرة ثانية مدعومة بالذكاء الاصطناعي في السعودية. رؤية ٢٠٣٠، عام الذكاء الاصطناعي ٢٠٢٦. The first AI-powered personal assistant built for Saudi Arabia — aligned with Vision 2030 and SDAIA.",
  keywords: ["Vision 2030", "رؤية 2030", "ذكاء اصطناعي", "SDAIA", "Year of AI 2026", "عام الذكاء الاصطناعي", "Saudi AI", "ذكرني", "Thakirni"],
  alternates: {
    canonical: "https://thakirni.com",
  },
  openGraph: {
    title: "ذكّرني | Thakirni – خل ذكّرني يرتب يومك 👀",
    description:
      "قل اللي بخاطرك… والباقي علينا. مدعوم برؤية ٢٠٣٠. Your AI-powered second brain — built for Saudi Arabia, aligned with Vision 2030.",
    url: "https://thakirni.com",
  },
}

export default function Home() {
  return (
    <main className="page-shell min-h-screen bg-background overflow-x-hidden">
      <LandingHeader />

      {/* Hero — the above-the-fold conversion zone */}
      <HeroSection />

      {/* How it works + social proof stats */}
      <TrustSignals />

      {/* Feature bento grid */}
      <FeaturesSection />

      {/* Pricing */}
      <PricingSection />

      {/* FAQ + final CTA */}
      <CTASection />

      {/* Vision 2030 alignment */}
      <Vision2030Section />

      <LandingFooter />
    </main>
  )
}
