import { LandingHeader } from "@/components/thakirni/landing-header"
import { HeroSection } from "@/components/thakirni/hero-section"
import { FeaturesSection } from "@/components/thakirni/features-section"
import { TrustSignals } from "@/components/thakirni/trust-signals"
import { CTASection } from "@/components/thakirni/cta-section"
import { LandingFooter } from "@/components/thakirni/landing-footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <TrustSignals />
      <CTASection />
      <LandingFooter />
    </main>
  )
}
