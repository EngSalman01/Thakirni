"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Heart, 
  GitBranch, 
  Link2, 
  Settings,
  Home,
  LogOut,
  MessageSquare,
  Calendar
} from "lucide-react"

const navItems = [
  { href: "/vault", icon: Home, labelAr: "الرئيسية", labelEn: "Home" },
  { href: "/vault", icon: MessageSquare, labelAr: "المساعد الذكي", labelEn: "AI Assistant" },
  { href: "/vault/plans", icon: Calendar, labelAr: "خططي", labelEn: "My Plans" },
  { href: "/vault/tributes", icon: Heart, labelAr: "ذكرياتي", labelEn: "My Tributes" },
  { href: "/vault/family-tree", icon: GitBranch, labelAr: "شجرة العائلة", labelEn: "Family Tree" },
  { href: "/vault/sadaqah", icon: Link2, labelAr: "روابط الصدقة", labelEn: "Sadaqah Links" },
  { href: "/vault/settings", icon: Settings, labelAr: "الإعدادات", labelEn: "Settings" },
]

export function VaultSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed top-0 end-0 h-screen w-64 bg-card border-s border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">ذ</span>
          </div>
          <div>
            <span className="text-lg font-bold text-card-foreground block">ذكرني</span>
            <span className="text-xs text-muted-foreground">مساعدك الذكي</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.labelAr}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold">م</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-card-foreground">محمد أحمد</p>
            <p className="text-xs text-muted-foreground">الخطة المميزة</p>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors mt-2">
          <LogOut className="w-5 h-5" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  )
}
