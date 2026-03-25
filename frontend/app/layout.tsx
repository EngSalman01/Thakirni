import { Toaster } from "@/components/ui/sonner"
import React from "react"
import type { Metadata, Viewport } from "next"
import { Tajawal, Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import "./globals.css"

// ── Fonts ─────────────────────────────────────────────────────────────────────

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
})

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
})

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: { default: "Thakirni — ذكرني | Your AI Second Brain", template: "%s | Thakirni" },
  description: "Thakirni is your AI-powered second brain. Remember everything, plan smarter, and stay on top of your life — in Arabic and English.",
  keywords: ["second brain", "productivity", "AI assistant", "Arabic", "ذكرني", "تطبيق ذكاء اصطناعي", "تنظيم"],
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
    description: "Your AI-powered second brain. Remember everything, plan smarter.",
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
  themeColor: "#2552ca",
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
    <html lang="ar" dir="rtl" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${tajawal.variable} ${plusJakartaSans.variable} ${beVietnamPro.variable} font-sans antialiased`}
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
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
            <Toaster richColors position="top-center" />
          </LanguageProvider>
        </ThemeProvider>

        {/* Analytics must be inside body */}
        <Analytics />
      </body>
    </html>
  )
}
