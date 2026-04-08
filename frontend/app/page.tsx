import type { Metadata } from "next"
import { LandingHeader } from "@/components/thakirni/landing-header"
import { HeroSection } from "@/components/thakirni/hero-section"
import { TrustSignals } from "@/components/thakirni/trust-signals"
import { FeaturesSection } from "@/components/thakirni/features-section"
import { WhatsAppDemo } from "@/components/thakirni/whatsapp-demo"
import { TestimonialsSection } from "@/components/thakirni/testimonials-section"
import { PricingSection } from "@/components/thakirni/pricing-section"
import { CTASection } from "@/components/thakirni/cta-section"
import { LandingFooter } from "@/components/thakirni/landing-footer"

export const metadata: Metadata = {
  title: "ذكّرني | Thakirni – مساعدك الذكي الشخصي",
  description:
    "ذكّرني هو أول مساعد ذكي شخصي وذاكرة ثانية مدعومة بالذكاء الاصطناعي في السعودية. نظّم مهامك، احفظ ذكرياتك، وحقق أهدافك. The first AI-powered personal assistant built for Saudi Arabia.",
  alternates: {
    canonical: "https://thakirni.com",
  },
  openGraph: {
    title: "ذكّرني | Thakirni – خل ذكّرني يرتب يومك 👀",
    description:
      "قل اللي بخاطرك… والباقي علينا. Your AI-powered second brain built for Saudi Arabia.",
    url: "https://thakirni.com",
  },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <LandingHeader />

      {/* Hero — the above-the-fold conversion zone */}
      <HeroSection />

      {/* How it works + social proof stats */}
      <TrustSignals />

      {/* Feature bento grid */}
      <FeaturesSection />

      {/* WhatsApp chat demo */}
      <WhatsAppDemo />

      {/* Social proof / testimonials */}
      <TestimonialsSection />

      {/* Pricing */}
      <PricingSection />

      {/* FAQ + final CTA */}
      <CTASection />

      <LandingFooter />

      {/* Server-rendered policy links — required for Google OAuth verification */}
      <div
        style={{
          background: "#0E0B07",
          padding: "12px",
          textAlign: "center",
          fontSize: "11px",
        }}
      >
        <a href="/privacy" style={{ color: "#475569", marginInlineEnd: "16px" }}>
          Privacy Policy
        </a>
        <a href="/terms" style={{ color: "#475569" }}>
          Terms of Service
        </a>
      </div>
    </main>
  )
}
