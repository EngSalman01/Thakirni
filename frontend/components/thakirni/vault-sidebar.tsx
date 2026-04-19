"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  LayoutGrid,
  CheckSquare,
  Bell,
  Mic,
  LineChart,
  Target,
  Heart,
  Flame,
  Brain,
  Upload as UploadIcon,
  Calendar as CalendarIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Languages,
  LogOut,
  Sparkles,
  Menu,
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { WordmarkStacked } from "@/components/thakirni/atelier"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────────────────────────
   VaultSidebar — atelier rewrite
   Preserves the exports: <VaultSidebar>, useSidebar(), <MobileMenuButton>
   Layout CSS classes (ds-sidebar, ds-main, ds-mob-nav) stay intact
   so inner vault routes continue to lay out correctly.
───────────────────────────────────────────────────────────────── */

// ── Profile + session ─────────────────────────────────────────

interface Profile {
  id: string
  full_name?: string
  avatar_url?: string
  plan_tier?: string | null
}

interface SidebarContextType {
  open: boolean
  setOpen: (open: boolean) => void
  collapsed: boolean
}

const SidebarContext = createContext<SidebarContextType>({
  open: false,
  setOpen: () => {},
  collapsed: false,
})

export function useSidebar() {
  return useContext(SidebarContext)
}

function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !mounted) return
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, plan_tier")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (mounted && data) setProfile(data as Profile)
        })
    })
    return () => {
      mounted = false
    }
  }, [])
  return profile
}

function useSignOut() {
  return useCallback(async () => {
    try {
      await createClient().auth.signOut()
    } finally {
      window.location.href = "/auth"
    }
  }, [])
}

// ── Nav data ──────────────────────────────────────────────────

type NavItem = {
  href: string
  icon: React.ComponentType<{ className?: string }>
  ar: string
  en: string
}

const NAV_PRIMARY: NavItem[] = [
  { href: "/vault", icon: LayoutGrid, ar: "لوحتك", en: "Dashboard" },
  { href: "/vault/plans", icon: CheckSquare, ar: "خططك", en: "Plans" },
  { href: "/vault/reminders", icon: Bell, ar: "تذكيراتك", en: "Reminders" },
  { href: "/vault/meetings", icon: Mic, ar: "اجتماعاتك", en: "Meetings" },
  { href: "/vault/analytics", icon: LineChart, ar: "تحليلات", en: "Analytics" },
]

const NAV_SECONDARY: NavItem[] = [
  { href: "/vault/goals", icon: Target, ar: "أهدافي", en: "Goals" },
  { href: "/vault/health", icon: Heart, ar: "الصحة", en: "Health" },
  { href: "/vault/habits", icon: Flame, ar: "عاداتي", en: "Habits" },
  { href: "/vault/focus", icon: Brain, ar: "التركيز", en: "Focus" },
  { href: "/vault/upload", icon: UploadIcon, ar: "الذكريات", en: "Memories" },
  { href: "/vault/calendar", icon: CalendarIcon, ar: "التقويم", en: "Calendar" },
]

// ── Small atoms ───────────────────────────────────────────────

function BrandMark({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span
        aria-hidden
        className="inline-flex items-center justify-center w-9 h-9 rounded-full"
        style={{
          background:
            "color-mix(in oklab, var(--c-ember) 14%, var(--atelier-bg-elevated))",
          border: "1px solid var(--atelier-border-strong)",
        }}
      >
        <Flame className="w-4 h-4" style={{ color: "var(--c-ember)" }} />
      </span>
    )
  }
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="inline-flex items-center justify-center w-9 h-9 rounded-full"
        style={{
          background:
            "color-mix(in oklab, var(--c-ember) 14%, var(--atelier-bg-elevated))",
          border: "1px solid var(--atelier-border-strong)",
        }}
      >
        <Flame className="w-4 h-4" style={{ color: "var(--c-ember)" }} />
      </span>
      <WordmarkStacked size="sm" orientation="inline" primary="latin" />
    </div>
  )
}

function IconButton({
  title,
  onClick,
  children,
  active = false,
}: {
  title: string
  onClick: () => void
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors"
      style={{
        border: "1px solid var(--atelier-border-strong)",
        background: active
          ? "color-mix(in oklab, var(--c-ember) 10%, transparent)"
          : "transparent",
        color: active ? "var(--c-ember)" : "var(--atelier-text-muted)",
      }}
    >
      {children}
    </button>
  )
}

function ThemeBtn() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  return (
    <IconButton
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </IconButton>
  )
}

function LangBtn() {
  const { language, setLanguage } = useLanguage()
  const isArabic = language === "ar"
  return (
    <IconButton
      title={isArabic ? "English" : "العربية"}
      onClick={() => setLanguage(isArabic ? "en" : "ar")}
    >
      <Languages className="w-4 h-4" />
    </IconButton>
  )
}

function Avatar({ profile }: { profile: Profile | null }) {
  const initial = profile?.full_name?.[0]?.toUpperCase() ?? "U"
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--c-ember) 0%, var(--c-brown) 100%)",
        color: "var(--c-obsidian)",
        fontFamily: "var(--atelier-font-display)",
        fontSize: 16,
        fontWeight: 500,
        border: "1px solid var(--atelier-border-strong)",
      }}
    >
      {profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.full_name ?? "User"}
          className="w-full h-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  )
}

// ── Sidebar row ────────────────────────────────────────────────

function SidebarRow({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
  numeral,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  collapsed: boolean
  numeral?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-none transition-colors",
        collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5",
      )}
      style={{
        color: active ? "var(--atelier-text)" : "var(--atelier-text-muted)",
        fontFamily: "var(--atelier-font-body)",
        fontSize: 14,
        letterSpacing: "0.01em",
      }}
    >
      {/* Active accent rail */}
      {active && (
        <span
          aria-hidden
          className="absolute inset-y-0 start-0 w-[2px]"
          style={{ background: "var(--c-ember)" }}
        />
      )}
      <Icon
        className={cn("shrink-0 w-4 h-4 transition-opacity")}
        style={{
          color: active ? "var(--c-ember)" : "currentColor",
          opacity: active ? 1 : 0.75,
        }}
      />
      {!collapsed && (
        <span className="flex-1 truncate">
          {numeral && (
            <span
              className="tabular-nums me-3"
              style={{
                color: active
                  ? "var(--c-ember)"
                  : "var(--atelier-text-subtle)",
                fontSize: 11,
                letterSpacing: "0.14em",
              }}
            >
              {numeral}
            </span>
          )}
          {label}
        </span>
      )}
    </Link>
  )
}

function SectionHeader({
  numeral,
  children,
}: {
  numeral: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex items-baseline gap-2 px-3 mt-6 mb-2"
      style={{
        color: "var(--atelier-text-subtle)",
        fontFamily: "var(--atelier-font-body)",
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      <span style={{ color: "var(--c-ember)" }} className="tabular-nums">
        {numeral}
      </span>
      <span>{children}</span>
    </div>
  )
}

// ── Desktop Sidebar ────────────────────────────────────────────

function DesktopSidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}) {
  const pathname = usePathname()
  const profile = useProfile()
  const handleSignOut = useSignOut()
  const { isArabic, t } = useLanguage()

  const tier = (profile?.plan_tier ?? "free").toUpperCase()
  const tierLabel =
    tier === "PRO"
      ? "Pro"
      : tier === "TEAMS" || tier === "COMPANY"
      ? "Teams"
      : t("خطة مجانية", "Free")

  const isActive = (href: string) =>
    href === "/vault" ? pathname === href : pathname.startsWith(href)

  return (
    <nav
      className={cn("ds-sidebar atelier-root", collapsed && "coll")}
      style={{
        background: "var(--atelier-bg)",
        borderInlineStartColor: "var(--atelier-border)",
        borderInlineEndColor: "var(--atelier-border)",
        borderTop: "none",
        borderBottom: "none",
        color: "var(--atelier-text)",
        fontFamily: "var(--atelier-font-body)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-5"
        style={{
          borderBottom: "1px solid var(--atelier-border)",
          minHeight: 72,
        }}
      >
        <div className="flex-1 overflow-hidden">
          {collapsed ? (
            <div className="flex justify-center">
              <BrandMark compact />
            </div>
          ) : (
            <Link href="/" aria-label="Thakirni">
              <BrandMark />
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand" : "Collapse"}
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors"
          style={{
            border: "1px solid var(--atelier-border-strong)",
            color: "var(--atelier-text-muted)",
            background: "transparent",
          }}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          )}
        </button>
      </div>

      {/* ── Nav scroll ── */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ padding: "12px 6px" }}
      >
        {!collapsed && (
          <SectionHeader numeral="01">
            {t("الرئيسية", "Main")}
          </SectionHeader>
        )}
        <div className="flex flex-col">
          {NAV_PRIMARY.map((item, i) => (
            <SidebarRow
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={isArabic ? item.ar : item.en}
              active={isActive(item.href)}
              collapsed={collapsed}
              numeral={String(i + 1).padStart(2, "0")}
            />
          ))}
        </div>

        {!collapsed && (
          <SectionHeader numeral="02">
            {t("المزيد", "More")}
          </SectionHeader>
        )}
        <div className="flex flex-col">
          {NAV_SECONDARY.map((item, i) => (
            <SidebarRow
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={isArabic ? item.ar : item.en}
              active={isActive(item.href)}
              collapsed={collapsed}
              numeral={collapsed ? undefined : String(i + 1).padStart(2, "0")}
            />
          ))}
        </div>

        <div
          className="my-4 mx-3"
          style={{ height: 1, background: "var(--atelier-border)" }}
        />

        <SidebarRow
          href="/vault/settings"
          icon={Settings}
          label={t("الإعدادات", "Settings")}
          active={pathname.startsWith("/vault/settings")}
          collapsed={collapsed}
        />

        {/* Upgrade nudge (free tier) */}
        {!collapsed && tier === "FREE" && (
          <Link
            href="/pricing"
            className="block mx-3 mt-6 p-4 transition-colors"
            style={{
              border: "1px solid var(--atelier-border-strong)",
              background: "var(--atelier-bg-elevated)",
              textDecoration: "none",
            }}
          >
            <div
              className="flex items-center gap-2 mb-2"
              style={{
                color: "var(--c-ember)",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontFamily: "var(--atelier-font-body)",
                fontWeight: 500,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("ترقية", "Upgrade")}</span>
            </div>
            <div
              className="atelier-h3"
              style={{
                color: "var(--atelier-text)",
                fontSize: 18,
                lineHeight: 1.2,
                marginBottom: 4,
              }}
            >
              {t("ارتقِ إلى ", "Move to ")}
              <em
                className="atelier-italic"
                style={{ color: "var(--c-ember)" }}
              >
                Pro
              </em>
            </div>
            <div
              style={{
                color: "var(--atelier-text-muted)",
                fontSize: 12,
                lineHeight: 1.45,
                fontFamily: "var(--atelier-font-body)",
              }}
            >
              {t(
                "رسائل غير محدودة، ذكريات بلا حد.",
                "Unlimited messages, memories without limit.",
              )}
            </div>
          </Link>
        )}
      </div>

      {/* ── Footer: controls + user ── */}
      <div
        className="px-4 pt-4 pb-5 shrink-0"
        style={{ borderTop: "1px solid var(--atelier-border)" }}
      >
        <div
          className={cn(
            "flex items-center gap-2 mb-3",
            collapsed ? "justify-center flex-col" : "justify-end",
          )}
        >
          <ThemeBtn />
          <LangBtn />
        </div>

        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center",
          )}
          style={{ padding: collapsed ? 0 : "6px 0" }}
        >
          <Avatar profile={profile} />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div
                className="truncate"
                style={{
                  fontFamily: "var(--atelier-font-body)",
                  fontSize: 13,
                  color: "var(--atelier-text)",
                  lineHeight: 1.25,
                }}
              >
                {profile?.full_name ?? t("المستخدم", "User")}
              </div>
              <div
                className="truncate"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--c-ember)",
                  marginTop: 2,
                }}
              >
                {tierLabel}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={handleSignOut}
              title={t("تسجيل الخروج", "Sign out")}
              className="transition-colors"
              style={{
                color: "var(--atelier-text-subtle)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

// ── Mobile Drawer ─────────────────────────────────────────────

function DrawerNavContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()
  const profile = useProfile()
  const handleSignOut = useSignOut()
  const { isArabic, t } = useLanguage()

  const isActive = (href: string) =>
    href === "/vault" ? pathname === href : pathname.startsWith(href)

  const renderList = (items: NavItem[]) =>
    items.map((item, i) => {
      const Icon = item.icon
      const active = isActive(item.href)
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className="relative flex items-center gap-3 py-3 px-3"
          style={{
            color: active ? "var(--atelier-text)" : "var(--atelier-text-muted)",
            fontFamily: "var(--atelier-font-body)",
            fontSize: 15,
            borderBottom: "1px solid var(--atelier-border)",
          }}
        >
          {active && (
            <span
              aria-hidden
              className="absolute inset-y-0 start-0 w-[2px]"
              style={{ background: "var(--c-ember)" }}
            />
          )}
          <span
            className="tabular-nums"
            style={{
              color: active ? "var(--c-ember)" : "var(--atelier-text-subtle)",
              fontSize: 11,
              letterSpacing: "0.14em",
              width: 20,
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <Icon
            className="w-4 h-4 shrink-0"
            style={{
              color: active ? "var(--c-ember)" : "currentColor",
              opacity: active ? 1 : 0.75,
            }}
          />
          <span className="flex-1 truncate">{isArabic ? item.ar : item.en}</span>
        </Link>
      )
    })

  return (
    <div
      className="atelier-root flex flex-col h-full"
      style={{
        background: "var(--atelier-bg)",
        color: "var(--atelier-text)",
        fontFamily: "var(--atelier-font-body)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-5"
        style={{ borderBottom: "1px solid var(--atelier-border)" }}
      >
        <Link href="/" onClick={onClose}>
          <BrandMark />
        </Link>
        <div className="flex gap-2">
          <ThemeBtn />
          <LangBtn />
        </div>
      </div>

      {/* User card */}
      <div
        className="flex items-center gap-3 mx-5 my-5 px-4 py-3"
        style={{
          border: "1px solid var(--atelier-border-strong)",
          background: "var(--atelier-bg-elevated)",
        }}
      >
        <Avatar profile={profile} />
        <div className="flex-1 min-w-0">
          <div
            className="truncate"
            style={{ color: "var(--atelier-text)", fontSize: 14 }}
          >
            {profile?.full_name ?? t("المستخدم", "User")}
          </div>
          <div
            className="truncate"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--c-ember)",
              marginTop: 2,
            }}
          >
            {t("فولت شخصي", "Personal vault")}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2">
        <SectionHeader numeral="01">
          {t("الرئيسية", "Core")}
        </SectionHeader>
        <div className="flex flex-col">{renderList(NAV_PRIMARY)}</div>

        <SectionHeader numeral="02">
          {t("المزيد", "More")}
        </SectionHeader>
        <div className="flex flex-col">{renderList(NAV_SECONDARY)}</div>
      </div>

      {/* Footer actions */}
      <div
        className="px-4 py-4 flex flex-col gap-1"
        style={{ borderTop: "1px solid var(--atelier-border)" }}
      >
        <Link
          href="/vault/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-3"
          style={{
            color: "var(--atelier-text-muted)",
            fontFamily: "var(--atelier-font-body)",
            fontSize: 14,
          }}
        >
          <Settings className="w-4 h-4" />
          {t("الإعدادات", "Settings")}
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-3 text-start"
          style={{
            color: "var(--c-ember)",
            fontFamily: "var(--atelier-font-body)",
            fontSize: 14,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <LogOut className="w-4 h-4" />
          {t("تسجيل الخروج", "Sign out")}
        </button>
      </div>
    </div>
  )
}

// ── Mobile Bottom Nav ─────────────────────────────────────────

function MobileBottomNavBar() {
  const pathname = usePathname()
  const { isArabic, t } = useLanguage()

  const items: { href: string; icon: React.ComponentType<{ className?: string }>; ar: string; en: string }[] = [
    { href: "/vault", icon: LayoutGrid, ar: "الرئيسية", en: "Home" },
    { href: "/vault/plans", icon: CheckSquare, ar: "الخطط", en: "Plans" },
    { href: "/vault/reminders", icon: Bell, ar: "تذكيرات", en: "Alerts" },
    { href: "/vault/habits", icon: Flame, ar: "العادات", en: "Habits" },
    { href: "/vault/settings", icon: Settings, ar: "إعدادات", en: "Settings" },
  ]

  return (
    <div
      className="ds-mob-nav atelier-root"
      style={{
        background:
          "color-mix(in oklab, var(--c-obsidian) 90%, transparent)",
        borderTop: "1px solid var(--atelier-border)",
        color: "var(--atelier-text)",
      }}
    >
      {items.map((item) => {
        const Icon = item.icon
        const active =
          item.href === "/vault"
            ? pathname === item.href
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-col items-center gap-1 px-3 py-1 transition-colors"
            style={{
              color: active
                ? "var(--c-ember)"
                : "var(--atelier-text-subtle)",
              textDecoration: "none",
            }}
          >
            <Icon className="w-5 h-5" />
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "var(--atelier-font-body)",
              }}
            >
              {isArabic ? item.ar : item.en}
            </span>
            {active && (
              <span
                aria-hidden
                className="absolute -bottom-0.5"
                style={{
                  width: 18,
                  height: 2,
                  background: "var(--c-ember)",
                  borderRadius: 1,
                }}
              />
            )}
          </Link>
        )
      })}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────

export function VaultSidebar({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { isArabic } = useLanguage()

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1100px)")
    setCollapsed(mq.matches)
    const fn = (e: MediaQueryListEvent) => setCollapsed(e.matches)
    mq.addEventListener("change", fn)
    return () => mq.removeEventListener("change", fn)
  }, [])

  const contextValue = useMemo(
    () => ({ open, setOpen, collapsed }),
    [open, collapsed],
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <DesktopSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <MobileBottomNavBar />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={isArabic ? "right" : "left"}
          className="w-80 max-w-[90vw] p-0 border-0"
          style={{ background: "var(--atelier-bg)" }}
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <DrawerNavContent onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {children && (
        <div
          className={cn("ds-main atelier-root", collapsed && "coll")}
          style={{
            background: "var(--atelier-bg)",
            color: "var(--atelier-text)",
          }}
        >
          {children}
        </div>
      )}
    </SidebarContext.Provider>
  )
}

export function MobileMenuButton() {
  const { setOpen } = useSidebar()
  const { t } = useLanguage()
  return (
    <button
      onClick={() => setOpen(true)}
      aria-label={t("فتح القائمة", "Open menu")}
      className="inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors"
      style={{
        border: "1px solid var(--atelier-border-strong)",
        background: "var(--atelier-bg-elevated)",
        color: "var(--atelier-text)",
      }}
    >
      <Menu className="w-4 h-4" />
    </button>
  )
}
