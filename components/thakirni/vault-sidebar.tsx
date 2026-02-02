"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Heart,
  GitBranch,
  Link2,
  Settings,
  Home,
  LogOut,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { BrandLogo } from "@/components/thakirni/brand-logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/vault", icon: Home, labelAr: "الرئيسية", labelEn: "Home" },
  {
    href: "/vault",
    icon: MessageSquare,
    labelAr: "المساعد الذكي",
    labelEn: "AI Assistant",
  },
  {
    href: "/vault/plans",
    icon: Calendar,
    labelAr: "خططي",
    labelEn: "My Plans",
  },
  {
    href: "/vault/settings",
    icon: Settings,
    labelAr: "الإعدادات",
    labelEn: "Settings",
  },
];

export function VaultSidebar() {
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
      // Use window.location to force a full refresh and clear any client-side state
      window.location.href = "/auth";
    } catch (error) {
      console.error("Error signing out:", error);
      // Fallback redirect even if signOut fails
      window.location.href = "/auth";
    }
  };

  return (
    <aside className="fixed top-0 end-0 h-screen w-64 bg-card border-s border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        {/* Full logo includes text, so we use it directly. Reduced from 140x50 to 100x35 */}
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo width={100} height={35} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive
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
      <div className="p-4 border-t border-border space-y-4">
        {/* Language Toggle for Vault */}
        <div className="px-4">
          <LanguageToggle />
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
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
          <div className="flex-1 min-w-0">
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
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors mt-2"
        >
          <LogOut className="w-5 h-5" />
          <span>{t("تسجيل الخروج", "Logout")}</span>
        </button>
      </div>
    </aside>
  );
}
