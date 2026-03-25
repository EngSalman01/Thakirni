"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Settings,
  LogOut,
  MessageSquare,
  Calendar,
  Menu,
  ListTodo,
  ChevronDown,
  Network,
  Sparkles,
  Waves,
  Users,
  HelpCircle,
  Upload,
  Mic,
  Bell,
  Target,
  Flame,
  Timer,
  FileText,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { BrandLogo } from "@/components/thakirni/brand-logo";
import { GlobalSearch } from "@/components/thakirni/global-search";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useMemo,
} from "react";
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
  slug: string;
  [key: string]: unknown;
}

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  plan_tier?: "FREE" | "INDIVIDUAL" | "COMPANY";
}

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelAr: string;
  labelEn: string;
}

interface SidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const SidebarContext = createContext<SidebarContextType>({
  open: false,
  setOpen: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

// ── Nav items config ──────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  { href: "/vault", icon: Network, labelAr: "خريطة الذاكرة", labelEn: "Memory Map" },
  { href: "/vault/assistant", icon: Sparkles, labelAr: "المساعد الذكي", labelEn: "AI Assistant" },
  { href: "/vault/plans", icon: ListTodo, labelAr: "خططي", labelEn: "My Plans" },
  { href: "/vault/meetings", icon: Mic, labelAr: "ملخص الاجتماعات", labelEn: "Meeting Summary" },
  { href: "/vault/goals", icon: Target, labelAr: "أهدافي", labelEn: "My Goals" },
  { href: "/vault/habits", icon: Flame, labelAr: "عاداتي", labelEn: "Habits" },
  { href: "/vault/analytics", icon: TrendingUp, labelAr: "التحليلات", labelEn: "Analytics" },
  { href: "/vault/focus", icon: Timer, labelAr: "التركيز", labelEn: "Focus Mode" },
  { href: "/vault/upload", icon: Waves, labelAr: "الذكريات", labelEn: "Memories" },
  { href: "/vault/settings/teams/new", icon: Users, labelAr: "الفرق", labelEn: "Teams" },
  { href: "/vault/settings", icon: Settings, labelAr: "الإعدادات", labelEn: "Settings" },
];

// ── User profile hook ─────────────────────────────────────────────────────────

function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (mounted) {
          setProfile(
            error
              ? { id: user.id, full_name: user.email?.split("@")[0] }
              : data
          );
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, []);

  return { profile, loading };
}


// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItemRow({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const { isArabic } = useLanguage();

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 py-3 px-6 text-sm font-semibold font-label transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-[#2552ca]/10 to-transparent text-[#2552ca] border-r-4 border-[#2552ca]"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <item.icon className="w-5 h-5 shrink-0" />
      <span>{isArabic ? item.labelAr : item.labelEn}</span>
    </Link>
  );
}

// ── Sign out ──────────────────────────────────────────────────────────────────

function useSignOut() {
  return useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/auth";
    }
  }, []);
}

// ── Full sidebar content ──────────────────────────────────────────────────────

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { profile } = useProfile();
  const handleSignOut = useSignOut();

  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="flex flex-col h-full bg-[#fbf9f8]">
      {/* Logo */}
      <div className="px-8 pt-8 pb-6 flex items-center gap-3">
        <Link href="/" onClick={onNavigate} className="flex items-center">
          <BrandLogo />
        </Link>
      </div>

      {/* Global search */}
      <div className="px-4 mb-2">
        <GlobalSearch />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col" aria-label="Main navigation">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.href;
          return (
            <NavItemRow
              key={`${item.href}-${idx}`}
              item={item}
              isActive={isActive}
              onNavigate={onNavigate}
            />
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-6 mt-auto space-y-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 text-sm font-semibold">
              <div className="w-8 h-8 rounded-full power-gradient flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile?.full_name ?? "User"} className="w-full h-full object-cover" />
                ) : initial}
              </div>
              <span className="flex-1 text-start truncate text-slate-700">
                {profile?.full_name ?? t("المستخدم", "User")}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>{t("حسابي", "My Account")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/vault/settings" className="cursor-pointer" onClick={onNavigate}>
                <Settings className="w-4 h-4 me-2" />
                {t("الإعدادات", "Settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/vault/plans" className="cursor-pointer" onClick={onNavigate}>
                <ListTodo className="w-4 h-4 me-2" />
                {t("خططي", "My Plans")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-500 focus:text-red-500 cursor-pointer"
            >
              <LogOut className="w-4 h-4 me-2" />
              {t("تسجيل الخروج", "Logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          href="#"
          className="flex items-center gap-3 text-slate-500 py-2 px-2 hover:text-[#2552ca] transition-colors text-sm font-semibold"
          onClick={onNavigate}
        >
          <HelpCircle className="w-5 h-5" />
          <span>{t("مركز المساعدة", "Help Center")}</span>
        </Link>
      </div>
    </div>
  );
}

// ── Mobile top bar ────────────────────────────────────────────────────────────

function MobileTopBar() {
  const { setOpen } = useContext(SidebarContext);
  const { t } = useLanguage();

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#fbf9f8] border-b border-slate-200/60 flex items-center justify-between px-4 shadow-ambient">
      {/* Logo: left in LTR, right in RTL */}
      <Link href="/" className="flex items-center order-1 rtl:order-2">
        <BrandLogo className="h-8 w-auto" />
      </Link>
      {/* Hamburger: right in LTR, left in RTL (drawer slides from that side) */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full hover:bg-slate-100 transition-colors order-2 rtl:order-1"
        aria-label={t("فتح القائمة", "Open menu")}
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>
    </div>
  );
}

// ── Exported sidebar ──────────────────────────────────────────────────────────

export function VaultSidebar() {
  const [open, setOpen] = useState(false);
  const { isArabic } = useLanguage();
  const contextValue = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <SidebarContext.Provider value={contextValue}>
      {/* Mobile sticky top bar — only on small screens */}
      <MobileTopBar />

      {/* Desktop */}
      <aside
        className="hidden lg:flex flex-col h-screen w-72 fixed left-0 top-0 z-40 overflow-y-auto border-r border-slate-200/60"
        style={{ background: "#fbf9f8" }}
        aria-label="Sidebar navigation"
      >
        <SidebarContent />
      </aside>

      {/* Mobile drawer sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={isArabic ? "right" : "left"}
          className="w-72 p-0 bg-[#fbf9f8] border-r border-slate-200"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </SidebarContext.Provider>
  );
}

/** Floating mobile menu trigger */
export function MobileMenuButton() {
  const { setOpen } = useSidebar();
  const { t } = useLanguage();

  return (
    <Button
      variant="outline"
      size="icon"
      className="lg:hidden rounded-full border-slate-200 shadow-ambient hover:shadow-card transition-shadow"
      onClick={() => setOpen(true)}
      aria-label={t("فتح القائمة", "Open menu")}
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}
