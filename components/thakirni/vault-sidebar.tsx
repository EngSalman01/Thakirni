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
} from "lucide-react";
import { BrandLogo } from "@/components/thakirni/brand-logo";
import { useLanguage } from "@/components/language-provider";
import { useState, useEffect, createContext, useContext } from "react";
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

// Context to allow child pages to render the mobile trigger
const SidebarContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

const navItems = [
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isArabic, t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(data || { full_name: user.email?.split("@")[0] });
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/auth";
    } catch (error) {
      console.error("Error signing out:", error);
      window.location.href = "/auth";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border flex justify-center">
        <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
          <BrandLogo width={100} height={35} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item, idx) => {
            const isActive = item.hash
              ? pathname === "/vault"
              : pathname === item.href;
            return (
              <li key={`${item.href}-${idx}`}>
                <Link
                  href={item.hash ? `${item.href}${item.hash}` : item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive && !item.hash
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">
                    {isArabic ? item.labelAr : item.labelEn}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-border space-y-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 rounded-xl transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="User"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary font-bold">
                    {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-start">
                {loading ? (
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <>
                    <p className="text-sm font-medium text-card-foreground truncate">
                      {profile?.full_name || t("مستخدم", "User")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile?.plan_tier === "COMPANY"
                        ? t("باقة الشركات", "Company Plan")
                        : profile?.plan_tier === "INDIVIDUAL"
                          ? t("باقة الأفراد", "Individual Plan")
                          : t("الباقة المجانية", "Free Plan")}
                    </p>
                  </>
                )}
              </div>
            </div>
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
                <Settings className="w-4 h-4 me-2" />
                {t("الإعدادات", "Settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/vault/plans"
                className="flex items-center cursor-pointer"
                onClick={onNavigate}
              >
                <Calendar className="w-4 h-4 me-2" />
                {t("خططي", "My Plans")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 me-2" />
              {t("تسجيل الخروج", "Logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function VaultSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {/* Desktop sidebar - hidden on mobile */}
      <aside className="hidden lg:flex fixed top-0 end-0 h-screen w-64 bg-card border-s border-border flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Mobile sheet sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72 p-0 bg-card">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
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

  return (
    <Button
      variant="outline"
      size="icon"
      className="lg:hidden bg-card border-border shadow-sm"
      onClick={() => setOpen(true)}
      aria-label={t("فتح القائمة", "Open menu")}
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}
