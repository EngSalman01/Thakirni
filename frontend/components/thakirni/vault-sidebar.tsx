"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Menu, LogOut, Settings, ChevronDown,
  LayoutDashboard, CheckSquare, Mic, BarChart2,
  Target, Flame, Brain, Calendar,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { BrandLogo } from "@/components/thakirni/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import {
  useState, useEffect, createContext, useContext,
  useCallback, useMemo,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Profile { id: string; full_name?: string; avatar_url?: string; }

interface SidebarContextType { open: boolean; setOpen: (open: boolean) => void; }

// ── Context ───────────────────────────────────────────────────────────────────

const SidebarContext = createContext<SidebarContextType>({ open: false, setOpen: () => {} });
export function useSidebar() { return useContext(SidebarContext); }

// ── Nav config ────────────────────────────────────────────────────────────────

const PRIMARY_NAV = [
  { href: "/vault",           icon: LayoutDashboard, labelAr: "لوحتك",      labelEn: "Dashboard" },
  { href: "/vault/plans",     icon: CheckSquare,     labelAr: "خططك",       labelEn: "Plans"     },
  { href: "/vault/meetings",  icon: Mic,             labelAr: "اجتماعاتك", labelEn: "Meetings"  },
  { href: "/vault/analytics", icon: BarChart2,       labelAr: "تحليلات",    labelEn: "Analytics" },
];

const ALL_NAV = [
  ...PRIMARY_NAV,
  { href: "/vault/goals",    icon: Target,    labelAr: "أهدافي",    labelEn: "Goals"     },
  { href: "/vault/habits",   icon: Flame,     labelAr: "عاداتي",    labelEn: "Habits"    },
  { href: "/vault/focus",    icon: Brain,     labelAr: "التركيز",   labelEn: "Focus"     },
  { href: "/vault/upload",   icon: Brain,     labelAr: "الذكريات",  labelEn: "Memories"  },
  { href: "/vault/calendar", icon: Calendar,  labelAr: "التقويم",   labelEn: "Calendar"  },
  { href: "/vault/settings", icon: Settings,  labelAr: "الإعدادات", labelEn: "Settings"  },
];

// ── Profile hook ──────────────────────────────────────────────────────────────

function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !mounted) return;
      supabase.from("profiles").select("id, full_name, avatar_url").eq("id", user.id).single()
        .then(({ data }) => { if (mounted && data) setProfile(data as Profile); });
    });
    return () => { mounted = false; };
  }, []);
  return profile;
}

// ── Sign out ──────────────────────────────────────────────────────────────────

function useSignOut() {
  return useCallback(async () => {
    try { await createClient().auth.signOut(); }
    finally { window.location.href = "/auth"; }
  }, []);
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ profile }: { profile: Profile | null }) {
  const initial = profile?.full_name?.[0]?.toUpperCase() ?? "U";
  return (
    <div className="w-7 h-7 rounded-full power-gradient flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
      {profile?.avatar_url
        ? <img src={profile.avatar_url} alt={profile?.full_name ?? "U"} className="w-full h-full object-cover" />
        : initial}
    </div>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────

function DrawerNav({ onClose }: { onClose: () => void }) {
  const { t, isArabic } = useLanguage();
  const pathname = usePathname();
  const profile = useProfile();
  const handleSignOut = useSignOut();

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
        <Link href="/" onClick={onClose}><BrandLogo variant="full" className="h-8 w-auto" /></Link>
        <div className="flex items-center gap-1"><LanguageToggle /><ThemeToggle /></div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3" aria-label="Navigation">
        {ALL_NAV.map((item) => {
          const isActive = item.href === "/vault" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-5 py-2.5 text-sm font-semibold transition-colors duration-150",
                isActive
                  ? "bg-primary/10 text-primary border-s-2 border-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
              <Icon className="w-4 h-4 shrink-0" />
              {isArabic ? item.labelAr : item.labelEn}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar profile={profile} />
          <span className="text-sm font-semibold text-foreground truncate">
            {profile?.full_name ?? t("المستخدم", "User")}
          </span>
        </div>
        <Link href="/vault/settings" onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150">
          <Settings className="w-4 h-4" />
          {t("الإعدادات", "Settings")}
        </Link>
        <button onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors w-full">
          <LogOut className="w-4 h-4" />
          {t("تسجيل الخروج", "Sign Out")}
        </button>
      </div>
    </div>
  );
}

// ── VaultSidebar — now a top navigation bar ───────────────────────────────────

export function VaultSidebar() {
  const [open, setOpen] = useState(false);
  const { isArabic, t } = useLanguage();
  const pathname = usePathname();
  const profile = useProfile();
  const handleSignOut = useSignOut();
  const contextValue = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <SidebarContext.Provider value={contextValue}>
      {/* ── TOP NAV BAR ── */}
      <header className="fixed top-0 inset-x-0 z-40 h-14 bg-background/80 backdrop-blur-2xl border-b border-border/50">
        <div className="h-full px-4 sm:px-6 flex items-center gap-3">

          {/* Logo */}
          <Link href="/" className="shrink-0 me-3">
            <BrandLogo variant="auto" className="h-7" />
          </Link>

          {/* Desktop primary nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1" aria-label="Primary navigation">
            {PRIMARY_NAV.map((item) => {
              const isActive = item.href === "/vault"
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap group",
                    isActive
                      ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                  aria-current={isActive ? "page" : undefined}>
                  <Icon className={cn("w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110", isActive && "stroke-[2.5]")} />
                  {isArabic ? item.labelAr : item.labelEn}
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-2 h-[2px] rounded-full bg-amber-500/60" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Spacer — mobile */}
          <div className="flex-1 md:hidden" />

          {/* Right controls */}
          <div className="flex items-center gap-0.5">
            <LanguageToggle />
            <ThemeToggle />

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-muted transition-colors ms-1 group">
                  <Avatar profile={profile} />
                  <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate">
                  {profile?.full_name ?? t("المستخدم", "User")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/vault/settings">
                    <Settings className="w-4 h-4 me-2" />
                    {t("الإعدادات", "Settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 me-2" />
                  {t("تسجيل الخروج", "Sign Out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8"
              onClick={() => setOpen(true)}
              aria-label={t("فتح القائمة", "Open menu")}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── MOBILE SHEET ── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={isArabic ? "right" : "left"} className="w-72 p-0 bg-background">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <DrawerNav onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </SidebarContext.Provider>
  );
}

/** Backward-compat mobile menu trigger */
export function MobileMenuButton() {
  const { setOpen } = useSidebar();
  const { t } = useLanguage();
  return (
    <Button variant="outline" size="icon" className="md:hidden rounded-full border-border shadow-ambient"
      onClick={() => setOpen(true)}
      aria-label={t("فتح القائمة", "Open menu")}>
      <Menu className="w-5 h-5" />
    </Button>
  );
}
