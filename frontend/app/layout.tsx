import { Toaster } from "@/components/ui/sonner"
import React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { MotionProvider } from "@/components/motion-provider"
import {
  Tajawal,
  Inter,
  Syne,
  Cormorant_Garamond,
  Fraunces,
  Plus_Jakarta_Sans,
  Reem_Kufi,
} from "next/font/google"
import "./globals.css"

// ── Legacy brand fonts (kept during migration) ──
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
})

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

// ── Atelier fonts (Obsidian Assembly-style redesign) ──
// Display serif — used for the wordmark and oversized section headings.
// Opsz axis: high optical size yields the sharp-contrast feel of OT Jubilee / Voyage.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--font-atelier-display",
  display: "swap",
})

// Body sans — Plus Jakarta Sans as a free substitute for Switzer.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-atelier-body",
  display: "swap",
})

// Arabic display — Reem Kufi carries an editorial display feel to mirror the Latin serif.
const reemKufi = Reem_Kufi({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-atelier-arabic",
  display: "swap",
})

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: { default: "Thakirni — ذكرني | Your AI Second Brain", template: "%s | Thakirni" },
  description: "Thakirni is your AI-powered second brain — built for Saudi Arabia's Vision 2030 and Year of AI 2026. Remember everything, plan smarter, and stay on top of your life in Arabic and English.",
  keywords: ["second brain", "productivity", "AI assistant", "Arabic", "ذكرني", "تطبيق ذكاء اصطناعي", "تنظيم", "Vision 2030", "رؤية 2030", "ذكاء اصطناعي", "SDAIA", "Year of AI 2026", "عام الذكاء الاصطناعي", "Saudi AI", "مساعد ذكي"],
  authors: [{ name: "Salman Almnaseer" }],
  creator: "Thakirni",
  metadataBase: new URL("https://thakirni.com"),
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: "en_US",
    url: "https://thakirni.com",
    siteName: "Thakirni",
    title: "Thakirni — ذكرني | Your AI Second Brain",
    description: "Your AI-powered second brain — built for Saudi Arabia's Vision 2030. Remember everything, plan smarter.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thakirni — ذكرني",
    description: "Your AI-powered second brain.",
  },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Thakirni" },
  formatDetection: { telephone: false },

  // ── Icons ──
  icons: {
    icon: "/favicon.svg",
    apple: "/images/icon-96.svg",
  },

  // ── Misc ──
  robots: {
    index: true,
    follow: true,
  },
}

// ── Viewport (separate export as of Next.js 14) ───────────────────────────────

export const viewport: Viewport = {
  themeColor: "#D97706",
  width: "device-width",
  initialScale: 1,
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /*
     * lang="ar" + dir="rtl" as defaults since the primary audience is Arabic.
     * LanguageProvider can update <html> attributes client-side if you switch to English.
     * suppressHydrationWarning on both html and body — next/font and ThemeProvider
     * both inject classes that differ between server and client renders.
     */
    <html lang="ar" dir="rtl" suppressHydrationWarning data-scroll-behavior="smooth"
      className={`${tajawal.variable} ${inter.variable} ${syne.variable} ${cormorant.variable} ${fraunces.variable} ${jakarta.variable} ${reemKufi.variable}`}>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        {/*
         * ThemeProvider must wrap everything so the dark/light class
         * is applied before any child renders — prevents theme flash.
         * LanguageProvider sits inside since it may depend on theme context
         * in the future and has no flash risk.
         */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <MotionProvider>
              {children}
            </MotionProvider>
            <Toaster richColors position="top-center" />
          </LanguageProvider>
        </ThemeProvider>

        {/* Analytics must be inside body */}
        <Analytics />
      </body>
    </html>
  )
}
