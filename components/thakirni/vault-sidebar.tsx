"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Settings,
  Home,
  LogOut,
  MessageSquare,
  Calendar,
  Menu,
  ListTodo,
  ChevronDown,
} from "lucide-react";
import { BrandLogo } from "@/components/thakirni/brand-logo";
import { useLanguage } from "@/components/language-provider";
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
import { User } from "@supabase/supabase-js";

// Types
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
  hash?: string;
}

interface SidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// Context
const SidebarContext = createContext<SidebarContextType>({
  open: false,
  setOpen: () => {},
});

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarContext.Provider");
  }
  return context;
}

// Navigation items configuration
const navItems: NavItem[] = [
  { href: "/vault", icon: Home, labelAr: "الرئيسية", labelEn: "Home" },
  {
    href: "/vault",
    icon: MessageSquare,
    labelAr: "المساعد الذكي",
    labelEn: "AI Assistant",
    hash: "#ai-chat",
  },
  {
    href: "/vault/plans",
    icon: ListTodo,
    labelAr: "خططي",
    labelEn: "My Plans",
  },
  {
    href: "/vault/calendar",
    icon: Calendar,
    labelAr: "التقويم",
    labelEn: "Calendar",
  },
  {
    href: "/vault/settings",
    icon: Settings,
    labelAr: "الإعدادات",
    labelEn: "Settings",
  },
];

// Sub-components
const LogoSection = ({ onNavigate }: { onNavigate?: () => void }) => (
  <div className="p-6 border-b border-border flex justify-center">
    <Link
      href="/"
      className="flex items-center gap-3 transition-opacity hover:opacity-80"
      onClick={onNavigate}
      aria-label="Thakirni Home"
    >
      <BrandLogo width={100} height={35} />
    </Link>
  </div>
);

const NavigationItem = ({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) => {
  const { isArabic } = useLanguage();

  return (
    <li>
      <Link
        href={item.hash ? `${item.href}${item.hash}` : item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isActive && !item.hash
            ? "bg-primary/10 text-primary shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span className="font-medium truncate">
          {isArabic ? item.labelAr : item.labelEn}
        </span>
      </Link>
    </li>
  );
};

const NavigationList = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4" aria-label="Main navigation">
      <ul className="space-y-2">
        {navItems.map((item, idx) => {
          const isActive = item.hash
            ? pathname === "/vault"
            : pathname === item.href;

          return (
            <NavigationItem
              key={`${item.href}-${idx}`}
              item={item}
              isActive={isActive}
              onNavigate={onNavigate}
            />
          );
        })}
      </ul>
    </nav>
  );
};

const UserAvatar = ({ profile }: { profile: Profile | null }) => {
  const initial = profile?.full_name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile.full_name || "User"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-primary font-bold text-base" aria-hidden="true">
          {initial}
        </span>
      )}
    </div>
  );
};

const UserInfo = ({
  profile,
  loading,
}: {
  profile: Profile | null;
  loading: boolean;
}) => {
  const { t } = useLanguage();

  const getPlanLabel = useCallback(
    (tier?: string) => {
      switch (tier) {
        case "COMPANY":
          return t("باقة الشركات", "Company Plan");
        case "INDIVIDUAL":
          return t("باقة الأفراد", "Individual Plan");
        default:
          return t("الباقة المجانية", "Free Plan");
      }
    },
    [t],
  );

  if (loading) {
    return (
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-3 w-20 bg-muted/70 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 text-start">
      <p className="text-sm font-medium text-card-foreground truncate">
        {profile?.full_name || t("مستخدم", "User")}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        {getPlanLabel(profile?.plan_tier)}
      </p>
    </div>
  );
};

const UserSection = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !mounted) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (mounted) {
          if (error) {
            console.error("[Sidebar] Error fetching profile:", error);
            setProfile({
              id: user.id,
              full_name: user.email?.split("@")[0],
            });
          } else {
            setProfile(data);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("[Sidebar] Error:", error);
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      window.location.href = "/auth";
    } catch (error) {
      console.error("[Sidebar] Error signing out:", error);
      // Force redirect even on error
      window.location.href = "/auth";
    }
  }, []);

  return (
    <div className="p-4 border-t border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={t("قائمة المستخدم", "User menu")}
          >
            <UserAvatar profile={profile} />
            <UserInfo profile={profile} loading={loading} />
            <ChevronDown
              className="w-4 h-4 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t("حسابي", "My Account")}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link
              href="/vault/settings"
              className="flex items-center cursor-pointer"
              onClick={onNavigate}
            >
              <Settings className="w-4 h-4 me-2" aria-hidden="true" />
              {t("الإعدادات", "Settings")}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href="/vault/plans"
              className="flex items-center cursor-pointer"
              onClick={onNavigate}
            >
              <Calendar className="w-4 h-4 me-2" aria-hidden="true" />
              {t("خططي", "My Plans")}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="w-4 h-4 me-2" aria-hidden="true" />
            {t("تسجيل الخروج", "Logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <LogoSection onNavigate={onNavigate} />
      <NavigationList onNavigate={onNavigate} />
      <UserSection onNavigate={onNavigate} />
    </div>
  );
}

export function VaultSidebar() {
  const [open, setOpen] = useState(false);

  const contextValue = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <SidebarContext.Provider value={contextValue}>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed top-0 end-0 h-screen w-64 bg-card border-s border-border flex-col z-40"
        aria-label="Sidebar navigation"
      >
        <SidebarContent />
      </aside>

      {/* Mobile sheet sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-72 p-0 bg-card"
          aria-describedby="mobile-nav-description"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <p id="mobile-nav-description" className="sr-only">
            Main navigation menu with links to home, AI assistant, plans,
            calendar, and settings
          </p>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </SidebarContext.Provider>
  );
}

/** Floating mobile menu button - place in vault pages */
export function MobileMenuButton() {
  const { setOpen } = useSidebar();
  const { t } = useLanguage();

  const handleClick = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  return (
    <Button
      variant="outline"
      size="icon"
      className="lg:hidden bg-card border-border shadow-lg hover:shadow-xl transition-shadow"
      onClick={handleClick}
      aria-label={t("فتح القائمة", "Open menu")}
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}
