import React, { Suspense } from "react"
import type { Metadata } from "next"
import { ThemeSync } from "@/components/theme-sync"
import { CommandPalette } from "@/components/thakirni/command-palette"
import { UserIdentify } from "@/components/user-identify"
import { ToastNotifier } from "@/components/thakirni/toast-notifier"
import { ConsentModal } from "@/components/compliance/consent-modal"
import { MobileBottomNav } from "@/components/thakirni/mobile-bottom-nav"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "لوحة التحكم | Dashboard",
  description:
    "أدر مهامك، عاداتك، أهدافك، وذكرياتك في مكان واحد. Manage your plans, habits, goals, and memories in one place.",
  robots: { index: false, follow: false },
}

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ThemeSync />
      <UserIdentify />
      <CommandPalette />
      <ConsentModal />
      <Suspense>
        <ToastNotifier />
      </Suspense>
      <div className="pb-20 md:pb-0">{children}</div>
      <MobileBottomNav />
    </>
  )
}
