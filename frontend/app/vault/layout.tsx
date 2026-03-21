import React from "react"
import type { Metadata } from "next"

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
  return <>{children}</>
}
