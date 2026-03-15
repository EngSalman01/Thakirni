import { Toaster } from "@/components/ui/sonner"
import React from "react"
import type { Metadata, Viewport } from "next"
import { Tajawal, Inter, IBM_Plex_Sans_Arabic } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import "./globals.css"

// ── Fonts ─────────────────────────────────────────────────────────────────────

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",   // prevents invisible text during font load
})

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-arabic",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "ذكرني | Thakirni",
    template: "%s | Thakirni",   // child pages can set their own title
  },
  description:
    "The first AI-powered personal assistant and second brain platform in Saudi Arabia. Organise your life, preserve your memories.",

  // ── Open Graph (WhatsApp, Twitter, LinkedIn previews) ──
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: ["en_US"],
    url: "https://thakirni.com",
    siteName: "Thakirni | ذكرني",
    title: "ذكرني | Thakirni",
    description: "The first AI-powered personal assistant and second brain platform in Saudi Arabia.",
    images: [
      {
        url: "/og-image.png",   // create a 1200×630 image and place in /public
        width: 1200,
        height: 630,
        alt: "Thakirni – Your Second Brain",
      },
    ],
  },

  // ── Twitter card ──
  twitter: {
    card: "summary_large_image",
    title: "ذكرني | Thakirni",
    description: "AI-powered personal assistant & second brain. Built for Saudi Arabia.",
    images: ["/og-image.png"],
  },

  // ── Icons ──
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },

  // ── Misc ──
  robots: {
    index: true,
    follow: true,
  },
}

// ── Viewport (separate export as of Next.js 14) ───────────────────────────────

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,   // prevents iOS auto-zoom on input focus
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${tajawal.variable} ${ibmPlexSansArabic.variable} ${inter.variable} font-sans antialiased`}
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
