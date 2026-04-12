"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  Bell,
  Brain,
  Calendar,
  CheckSquare,
  ChevronDown,
  Flame,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { BrandLogo } from "@/components/thakirni/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useState, useEffect, createContext, useContext, useCallback, useMemo, type ElementType } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
}

interface SidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({ open: false, setOpen: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

const PRIMARY_NAV = [
  { href: "/vault", icon: LayoutDashboard, labelAr: "لوحتك", labelEn: "Dashboard" },
  { href: "/vault/plans",     icon: CheckSquare, labelAr: "خططك",      labelEn: "Plans"     },
  { href: "/vault/reminders", icon: Bell,        labelAr: "تذكيراتك",  labelEn: "Reminders" },
  { href: "/vault/meetings", icon: Mic, labelAr: "اجتماعاتك", labelEn: "Meetings" },
  { href: "/vault/analytics", icon: BarChart2, labelAr: "تحليلات", labelEn: "Analytics" },
];

const SECONDARY_NAV = [
  { href: "/vault/goals", icon: Target, labelAr: "أهدافي", labelEn: "Goals" },
  { href: "/vault/health", icon: Heart, labelAr: "الصحة", labelEn: "Health" },
  { href: "/vault/habits", icon: Flame, labelAr: "عاداتي", labelEn: "Habits" },
  { href: "/vault/focus", icon: Brain, labelAr: "التركيز", labelEn: "Focus" },
  { href: "/vault/upload", icon: Brain, labelAr: "الذكريات", labelEn: "Memories" },
  { href: "/vault/calendar", icon: Calendar, labelAr: "التقويم", labelEn: "Calendar" },
  { href: "/vault/settings", icon: Settings, labelAr: "الإعدادات", labelEn: "Settings" },
];

function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !mounted) return;

      supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (mounted && data) setProfile(data as Profile);
        });
    });

    return () => {
      mounted = false;
    };
  }, []);

  return profile;
}

function useSignOut() {
  return useCallback(async () => {
    try {
      await createClient().auth.signOut();
    } finally {
      window.location.href = "/auth";
    }
  }, []);
}

function Avatar({ profile }: { profile: Profile | null }) {
  const initial = profile?.full_name?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full power-gradient text-sm font-bold text-white">
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile?.full_name ?? "User"}
          className="h-full w-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  );
}

function DrawerLink({
  href,
  label,
  icon: Icon,
  active,
  onClose,
}: {
  href: string;
  label: string;
  icon: ElementType;
  active: boolean;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all",
        active
          ? "border-amber-300/50 bg-amber-500/10 text-amber-700 dark:border-amber-700/40 dark:bg-amber-500/12 dark:text-amber-300"
          : "border-border/70 bg-white/70 text-muted-foreground hover:border-amber-300/40 hover:bg-white hover:text-foreground dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function DrawerNav({ onClose }: { onClose: () => void }) {
  const { t, isArabic } = useLanguage();
  const pathname = usePathname();
  const profile = useProfile();
  const handleSignOut = useSignOut();

  return (
    <div className="flex h-full flex-col bg-background px-4 pb-4 pt-4">
      <div className="shell-panel-strong mb-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" onClick={onClose}>
            <BrandLogo variant="full" iconSize={34} />
          </Link>
          <div className="flex items-center gap-1.5 nav-shell px-1.5 py-1.5">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="mt-4 rounded-[1.4rem] border border-border/80 bg-white/75 p-4 dark:bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <Avatar profile={profile} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {profile?.full_name ?? t("المستخدم", "User")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("فولت شخصي ذكي", "Personal AI vault")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5">
        <div>
          <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
            {t("الرئيسية", "Core")}
          </p>
          <div className="space-y-2">
            {PRIMARY_NAV.map((item) => {
              const active = item.href === "/vault" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <DrawerLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={isArabic ? item.labelAr : item.labelEn}
                  active={active}
                  onClose={onClose}
                />
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
            {t("المزيد", "More")}
          </p>
          <div className="space-y-2">
            {SECONDARY_NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <DrawerLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={isArabic ? item.labelAr : item.labelEn}
                  active={active}
                  onClose={onClose}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-border/70 pt-4">
        <Link
          href="/vault/settings"
          onClick={onClose}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          {t("الإعدادات", "Settings")}
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          {t("تسجيل الخروج", "Sign Out")}
        </button>
      </div>
    </div>
  );
}

export function VaultSidebar() {
  const [open, setOpen] = useState(false);
  const { isArabic, t } = useLanguage();
  const pathname = usePathname();
  const profile = useProfile();
  const handleSignOut = useSignOut();
  const contextValue = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <SidebarContext.Provider value={contextValue}>
      <header className="fixed inset-x-0 top-0 z-40 h-16 px-3 pt-2 sm:px-5">
        <div className="mx-auto flex h-full max-w-7xl items-start">
          <div className="shell-panel flex h-12 w-full items-center gap-3 px-3 sm:px-4">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <BrandLogo variant="auto" iconSize={32} />
              <div className="hidden xl:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Vault
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("مساعدك اليومي", "Your daily command center")}
                </p>
              </div>
            </Link>

            <nav className="hidden flex-1 justify-center md:flex" aria-label="Primary navigation">
              <div className="nav-shell flex items-center gap-0.5 p-1">
                {PRIMARY_NAV.map((item) => {
                  const active = item.href === "/vault" ? pathname === item.href : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-all",
                        active
                          ? "bg-amber-500/12 text-amber-700 dark:bg-amber-500/14 dark:text-amber-300"
                          : "text-muted-foreground hover:bg-white/75 hover:text-foreground dark:hover:bg-white/[0.05]"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active && "stroke-[2.4]")} />
                      <span>{isArabic ? item.labelAr : item.labelEn}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="ms-auto flex items-center gap-1.5">
              <div className="hidden items-center gap-1.5 nav-shell px-1.5 py-1.5 md:flex">
                <LanguageToggle />
                <ThemeToggle />
              </div>

              <Link
                href="/vault/settings"
                className="hidden items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-500/14 dark:border-amber-700/30 dark:text-amber-300 lg:inline-flex"
              >
                <Sparkles className="h-4 w-4" />
                {t("ترقية الخطة", "Upgrade")}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden items-center gap-2 rounded-full nav-shell px-2 py-1.5 md:flex">
                    <Avatar profile={profile} />
                    <p className="hidden max-w-28 min-w-0 truncate text-sm font-semibold text-foreground lg:block">
                      {profile?.full_name ?? t("المستخدم", "User")}
                    </p>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                    {profile?.full_name ?? t("المستخدم", "User")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/vault/settings">
                      <Settings className="me-2 h-4 w-4" />
                      {t("الإعدادات", "Settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/vault/settings">
                      <Sparkles className="me-2 h-4 w-4" />
                      {t("ترقية الخطة", "Upgrade")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="me-2 h-4 w-4" />
                    {t("تسجيل الخروج", "Sign Out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full nav-shell md:hidden"
                onClick={() => setOpen(true)}
                aria-label={t("فتح القائمة", "Open menu")}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={isArabic ? "right" : "left"} className="w-80 max-w-[90vw] p-0 bg-background">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <DrawerNav onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </SidebarContext.Provider>
  );
}

export function MobileMenuButton() {
  const { setOpen } = useSidebar();
  const { t } = useLanguage();

  return (
    <Button
      variant="outline"
      size="icon"
      className="md:hidden rounded-full border-border bg-background/80 shadow-ambient backdrop-blur-xl"
      onClick={() => setOpen(true)}
      aria-label={t("فتح القائمة", "Open menu")}
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}
