"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { useTheme } from "next-themes";
import { useState, useEffect, createContext, useContext, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  plan_tier?: string | null;
}

interface SidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  collapsed: boolean;
}

const SidebarContext = createContext<SidebarContextType>({ open: false, setOpen: () => {}, collapsed: false });

export function useSidebar() {
  return useContext(SidebarContext);
}

const NAV_ITEMS = [
  { href: "/vault",            icon: "⊞", ar: "لوحتك",      en: "Dashboard" },
  { href: "/vault/plans",      icon: "✓", ar: "خططك",       en: "Plans",      badge: null },
  { href: "/vault/reminders",  icon: "🔔", ar: "تذكيراتك",  en: "Reminders"   },
  { href: "/vault/meetings",   icon: "🎤", ar: "اجتماعاتك", en: "Meetings"    },
  { href: "/vault/analytics",  icon: "📊", ar: "تحليلات",   en: "Analytics"   },
];

const SECONDARY_ITEMS = [
  { href: "/vault/goals",    icon: "🎯", ar: "أهدافي",     en: "Goals"    },
  { href: "/vault/health",   icon: "❤️", ar: "الصحة",     en: "Health"   },
  { href: "/vault/habits",   icon: "🔥", ar: "عاداتي",    en: "Habits"   },
  { href: "/vault/focus",    icon: "🧠", ar: "التركيز",   en: "Focus"    },
  { href: "/vault/upload",   icon: "📂", ar: "الذكريات",  en: "Memories" },
  { href: "/vault/calendar", icon: "📅", ar: "التقويم",   en: "Calendar" },
];

function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !mounted) return;
      supabase.from("profiles").select("id, full_name, avatar_url, plan_tier")
        .eq("id", user.id).single()
        .then(({ data }) => { if (mounted && data) setProfile(data as Profile); });
    });
    return () => { mounted = false; };
  }, []);
  return profile;
}

function useSignOut() {
  return useCallback(async () => {
    try { await createClient().auth.signOut(); }
    finally { window.location.href = "/auth"; }
  }, []);
}

// ── Logo ─────────────────────────────────────────────────────────────────────
function Logo({ compact = false }: { compact?: boolean }) {
  const size = compact ? 32 : 34;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: size, height: size, borderRadius: Math.round(size * 0.3), flexShrink: 0,
        background: "linear-gradient(135deg,#FBBF24 0%,#D97706 50%,#92400E 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(size * 0.47), fontWeight: 900, color: "#fff",
        boxShadow: "0 4px 16px rgba(217,119,6,.35)",
        fontFamily: "var(--font-tajawal),sans-serif",
      }}>ذ</div>
      {!compact && (
        <div>
          <div style={{ fontSize: ".92rem", fontWeight: 900, color: "var(--tx)", lineHeight: 1, letterSpacing: "-.01em", fontFamily: "var(--font-tajawal),sans-serif" }}>ذكرني</div>
          <div style={{ fontSize: ".58rem", fontWeight: 700, color: "var(--tx3)", letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "var(--font-inter),sans-serif" }}>Thakirni</div>
        </div>
      )}
    </div>
  );
}

// ── Theme/Lang buttons ────────────────────────────────────────────────────────
function ThemeBtn() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button className="icon-btn" onClick={() => setTheme(isDark ? "light" : "dark")} title={isDark ? "وضع النهار" : "وضع الليل"}>
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
function LangBtn() {
  const { language, setLanguage } = useLanguage();
  const isArabic = language === "ar";
  return (
    <button className="icon-btn" onClick={() => setLanguage(isArabic ? "en" : "ar")}
      style={{ fontSize: ".72rem", fontWeight: 800, fontFamily: isArabic ? "var(--font-inter),sans-serif" : "var(--font-tajawal),sans-serif" }}>
      {isArabic ? "EN" : "ع"}
    </button>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ profile }: { profile: Profile | null }) {
  const initial = profile?.full_name?.[0]?.toUpperCase() ?? "U";
  return (
    <div style={{ width: 32, height: 32, borderRadius: 99, background: "var(--grad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".8rem", fontWeight: 900, color: "#fff", flexShrink: 0, overflow: "hidden" }}>
      {profile?.avatar_url
        ? <img src={profile.avatar_url} alt={profile.full_name ?? "User"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initial}
    </div>
  );
}

// ── Sidebar Nav Item ─────────────────────────────────────────────────────────
function NavItem({ href, icon, label, active, collapsed }: { href: string; icon: string; label: string; active: boolean; collapsed: boolean }) {
  return (
    <Link href={href}
      style={{
        width: "100%", display: "flex", alignItems: "center",
        gap: collapsed ? 0 : 10, padding: collapsed ? "11px" : "10px 11px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius: 10, marginBottom: 3, textDecoration: "none",
        fontFamily: "var(--font-tajawal),sans-serif", fontSize: ".88rem", fontWeight: 700,
        background: active ? "rgba(245,158,11,.1)" : "transparent",
        color: active ? "var(--amb)" : "var(--tx2)",
        position: "relative", transition: "background .15s ease, color .15s ease",
      }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(128,96,32,.06)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--tx)"; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--tx2)"; } }}
    >
      {active && <div style={{ position: "absolute", insetInlineEnd: 0, top: "20%", height: "60%", width: 3, background: "var(--grad)", borderRadius: "0 2px 2px 0" }} />}
      <span style={{ flexShrink: 0, opacity: active ? 1 : 0.75, fontSize: 18 }}>{icon}</span>
      {!collapsed && <span style={{ flex: 1, textAlign: "inherit" }}>{label}</span>}
    </Link>
  );
}

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
function DesktopSidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const pathname = usePathname();
  const profile = useProfile();
  const handleSignOut = useSignOut();
  const { isArabic, t } = useLanguage();

  const tier = (profile?.plan_tier ?? "free").toUpperCase();

  return (
    <nav
      className={`ds-sidebar${collapsed ? " coll" : ""}`}
      style={{ fontFamily: isArabic ? "var(--font-tajawal),sans-serif" : "var(--font-inter),sans-serif" }}
    >
      {/* Logo + collapse */}
      <div style={{ padding: "18px 12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--bd)", flexShrink: 0, minHeight: 64 }}>
        <div style={{ overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}>
          {collapsed
            ? <div style={{ display: "flex", justifyContent: "center", width: "100%" }}><Logo compact /></div>
            : <Link href="/"><Logo /></Link>}
        </div>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ flexShrink: 0, marginInlineStart: 4, width: 28, height: 28, background: "var(--s2)", borderRadius: 99, border: "1px solid var(--bd)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--tx2)" }}>
            ›
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{ position: "absolute", bottom: 80, insetInlineStart: 0, insetInlineEnd: 0, margin: "auto", width: 28, height: 28, background: "var(--s2)", borderRadius: 99, border: "1px solid var(--bd)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--tx2)" }}>
            ‹
          </button>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 8px" }}>
        {!collapsed && (
          <div style={{ fontSize: ".6rem", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(245,158,11,.45)", marginBottom: 8, padding: "0 8px" }}>
            {t("الرئيسية", "Main")}
          </div>
        )}
        {NAV_ITEMS.map(item => {
          const active = item.href === "/vault" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <NavItem key={item.href} href={item.href} icon={item.icon}
              label={isArabic ? item.ar : item.en} active={active} collapsed={collapsed} />
          );
        })}

        {!collapsed && (
          <div style={{ fontSize: ".6rem", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(245,158,11,.45)", margin: "12px 0 8px", padding: "0 8px" }}>
            {t("المزيد", "More")}
          </div>
        )}
        {!collapsed && SECONDARY_ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <NavItem key={item.href} href={item.href} icon={item.icon}
              label={isArabic ? item.ar : item.en} active={active} collapsed={collapsed} />
          );
        })}

        <div style={{ height: 1, background: "var(--bd)", margin: "10px 6px" }} />

        {/* Settings */}
        <NavItem href="/vault/settings" icon="⚙️"
          label={t("الإعدادات", "Settings")}
          active={pathname.startsWith("/vault/settings")} collapsed={collapsed} />

        {/* Upgrade nudge (free tier) */}
        {!collapsed && tier === "FREE" && (
          <Link href="/vault/settings/billing" style={{ display: "block", margin: "10px 4px 0", padding: "10px 12px", background: "linear-gradient(135deg,rgba(251,191,36,.1) 0%,rgba(146,64,14,.06) 100%)", border: "1px solid var(--bd-a)", borderRadius: 10, textDecoration: "none" }}>
            <div style={{ fontSize: ".75rem", fontWeight: 800, color: "var(--amb)", marginBottom: 2 }}>✨ {t("ارتقِ للبرو", "Upgrade to Pro")}</div>
            <div style={{ fontSize: ".68rem", color: "var(--tx2)" }}>{t("رسائل غير محدودة", "Unlimited messages")}</div>
          </Link>
        )}
      </div>

      {/* Bottom: theme/lang + user */}
      <div style={{ padding: "10px 10px 14px", borderTop: "1px solid var(--bd)", flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: "flex", gap: 6, marginBottom: 10, justifyContent: "flex-end" }}>
            <ThemeBtn /><LangBtn />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px", borderRadius: 10, cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(128,96,32,.06)"}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
        >
          <Avatar profile={profile} />
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--tx)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.full_name ?? t("المستخدم", "User")}</div>
              <div style={{ fontSize: ".68rem", color: "var(--tx3)" }}>{tier === "PRO" ? "Pro ✦" : tier === "TEAMS" ? "Teams ✦" : t("خطة مجانية", "Free plan")}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleSignOut} style={{ color: "var(--tx3)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }} title={t("تسجيل الخروج", "Sign out")}>⏻</button>
          )}
        </div>
        {collapsed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", marginTop: 8 }}>
            <ThemeBtn /><LangBtn />
          </div>
        )}
      </div>
    </nav>
  );
}

// ── Mobile Drawer Nav ────────────────────────────────────────────────────────
function DrawerNavContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const profile = useProfile();
  const handleSignOut = useSignOut();
  const { isArabic, t } = useLanguage();

  return (
    <div style={{ display: "flex", height: "100%", flexDirection: "column", background: "var(--bg)", padding: "16px", color: "var(--tx)", fontFamily: isArabic ? "var(--font-tajawal),sans-serif" : "var(--font-inter),sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "0 4px" }}>
        <Link href="/" onClick={onClose}><Logo /></Link>
        <div style={{ display: "flex", gap: 6 }}><ThemeBtn /><LangBtn /></div>
      </div>

      {/* User */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--s1)", border: "1px solid var(--bd)", borderRadius: 12, marginBottom: 20 }}>
        <Avatar profile={profile} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: ".85rem", fontWeight: 700, color: "var(--tx)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.full_name ?? t("المستخدم", "User")}</div>
          <div style={{ fontSize: ".7rem", color: "var(--tx3)" }}>{t("فولت شخصي ذكي", "Personal AI vault")}</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: ".6rem", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(245,158,11,.5)", marginBottom: 8, padding: "0 8px" }}>
          {t("الرئيسية", "Core")}
        </div>
        {NAV_ITEMS.map(item => {
          const active = item.href === "/vault" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                borderRadius: 10, marginBottom: 4, textDecoration: "none",
                fontWeight: 700, fontSize: ".9rem",
                background: active ? "rgba(245,158,11,.1)" : "transparent",
                color: active ? "var(--amb)" : "var(--tx2)",
                border: active ? "1px solid var(--bd-a)" : "1px solid transparent",
              }}>
              <span>{item.icon}</span>
              <span>{isArabic ? item.ar : item.en}</span>
            </Link>
          );
        })}
        <div style={{ height: 1, background: "var(--bd)", margin: "8px 0" }} />
        {SECONDARY_ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                borderRadius: 10, marginBottom: 3, textDecoration: "none",
                fontWeight: 600, fontSize: ".88rem",
                background: active ? "rgba(245,158,11,.08)" : "transparent",
                color: active ? "var(--amb)" : "var(--tx2)",
              }}>
              <span>{item.icon}</span>
              <span>{isArabic ? item.ar : item.en}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid var(--bd)", paddingTop: 12, marginTop: 8 }}>
        <Link href="/vault/settings" onClick={onClose}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, color: "var(--tx2)", textDecoration: "none", fontSize: ".88rem", fontWeight: 600 }}>
          ⚙️ {t("الإعدادات", "Settings")}
        </Link>
        <button onClick={handleSignOut}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 10, color: "var(--red)", fontSize: ".88rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          ⏻ {t("تسجيل الخروج", "Sign Out")}
        </button>
      </div>
    </div>
  );
}

// ── Mobile Bottom Nav ─────────────────────────────────────────────────────────
function MobileBottomNavBar() {
  const pathname = usePathname();
  const { isArabic, t } = useLanguage();
  const { setOpen } = useSidebar();

  const items = [
    { href: "/vault",           icon: "⊞", ar: "الرئيسية", en: "Home"     },
    { href: "/vault/plans",     icon: "✓", ar: "الخطط",    en: "Plans"    },
    { href: "/vault/reminders", icon: "🔔", ar: "تذكيرات", en: "Alerts"   },
    { href: "/vault/habits",    icon: "🔥", ar: "العادات", en: "Habits"   },
    { href: "/vault/settings",  icon: "⚙️", ar: "إعدادات", en: "Settings" },
  ];

  return (
    <div className="ds-mob-nav">
      {items.map(item => {
        const active = item.href === "/vault" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 12px", color: active ? "var(--amb)" : "var(--tx3)", textDecoration: "none", position: "relative" }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: ".58rem", fontWeight: 700, fontFamily: isArabic ? "var(--font-tajawal),sans-serif" : "var(--font-inter),sans-serif" }}>{isArabic ? item.ar : item.en}</span>
            {active && <div style={{ position: "absolute", bottom: 2, width: 18, height: 2, borderRadius: 1, background: "var(--amb)" }} />}
          </Link>
        );
      })}
    </div>
  );
}

// ── Main VaultSidebar export ──────────────────────────────────────────────────
export function VaultSidebar({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { isArabic } = useLanguage();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1100px)");
    setCollapsed(mq.matches);
    const fn = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const contextValue = useMemo(() => ({ open, setOpen, collapsed }), [open, collapsed]);

  return (
    <SidebarContext.Provider value={contextValue}>
      <DesktopSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <MobileBottomNavBar />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={isArabic ? "right" : "left"} className="w-80 max-w-[90vw] p-0" style={{ background: "var(--bg)" }}>
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <DrawerNavContent onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {children && (
        <div className={`ds-main${collapsed ? " coll" : ""}`}>
          {children}
        </div>
      )}
    </SidebarContext.Provider>
  );
}

export function MobileMenuButton() {
  const { setOpen } = useSidebar();
  const { t } = useLanguage();
  return (
    <button
      onClick={() => setOpen(true)}
      aria-label={t("فتح القائمة", "Open menu")}
      style={{ width: 40, height: 40, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--s1)", border: "1px solid var(--bd)", cursor: "pointer", color: "var(--tx)" }}>
      ☰
    </button>
  );
}
