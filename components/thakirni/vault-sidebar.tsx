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
  const { user, logout } = useUser();

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
                      ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400",
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
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-card-foreground truncate">
              {user?.name || t("ضيف", "Guest")}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors mt-2"
        >
          <LogOut className="w-5 h-5" />
          <span>{t("تسجيل الخروج", "Logout")}</span>
        </button>
      </div>
    </aside>
  );
}
