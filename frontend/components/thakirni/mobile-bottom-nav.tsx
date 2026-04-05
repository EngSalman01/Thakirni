"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CheckSquare, Calendar, BarChart2, Settings } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const NAV = [
  { href: "/vault",           icon: Home,        labelAr: "الرئيسية",  labelEn: "Home"      },
  { href: "/vault/plans",     icon: CheckSquare, labelAr: "المهام",    labelEn: "Tasks"     },
  { href: "/vault/calendar",  icon: Calendar,    labelAr: "التقويم",   labelEn: "Calendar"  },
  { href: "/vault/analytics", icon: BarChart2,   labelAr: "تحليلات",   labelEn: "Analytics" },
  { href: "/vault/settings",  icon: Settings,    labelAr: "الإعدادات", labelEn: "Settings"  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isArabic } = useLanguage()

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/60 safe-area-pb"
      aria-label={isArabic ? "التنقل الرئيسي" : "Main navigation"}
    >
      <div className="flex items-stretch h-16">
        {NAV.map(({ href, icon: Icon, labelAr, labelEn }) => {
          const isActive = href === "/vault" ? pathname === href : pathname.startsWith(href)
          const label = isArabic ? labelAr : labelEn
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors min-h-[44px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div whileTap={{ scale: 0.85 }} transition={{ duration: 0.1 }}>
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              </motion.div>
              <span className={cn(
                "text-[10px] font-label font-semibold tracking-tight leading-none",
                isArabic && "font-arabic"
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
