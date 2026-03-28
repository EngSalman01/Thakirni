import type { Metadata } from "next"
import { LandingHeader } from "@/components/thakirni/landing-header"
import { HeroSection } from "@/components/thakirni/hero-section"
import { FeaturesSection } from "@/components/thakirni/features-section"
import { TrustSignals } from "@/components/thakirni/trust-signals"
import { CTASection } from "@/components/thakirni/cta-section"
import { LandingFooter } from "@/components/thakirni/landing-footer"

export const metadata: Metadata = {
  title: "ذكرني | Thakirni – مساعدك الذكي الشخصي",
  description:
    "ذكرني هو أول مساعد ذكي شخصي وذاكرة ثانية مدعومة بالذكاء الاصطناعي في السعودية. نظّم مهامك، احفظ ذكرياتك، وحقق أهدافك. The first AI-powered personal assistant built for Saudi Arabia.",
  alternates: {
    canonical: "https://thakirni.com",
  },
  openGraph: {
    title: "ذكرني | Thakirni",
    description:
      "Your AI-powered second brain. Organise tasks, preserve memories, achieve goals.",
    url: "https://thakirni.com",
  },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <TrustSignals />
      <CTASection />
      <LandingFooter />
      {/* Server-rendered policy links — required for Google OAuth verification */}
      <div style={{ background: "#0f172a", padding: "12px", textAlign: "center", fontSize: "12px" }}>
        <a href="/privacy" style={{ color: "#94a3b8", marginRight: "16px" }}>Privacy Policy</a>
        <a href="/terms" style={{ color: "#94a3b8" }}>Terms of Service</a>
      </div>
    </main>
  )
}
