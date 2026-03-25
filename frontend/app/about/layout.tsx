import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About",
  description: "Meet Salman Almnaseer, the solo developer behind Thakirni.",
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
