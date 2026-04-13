"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Tag,
  Megaphone,
  Settings,
  ArrowLeft,
  ListTodo,
  ScrollText,
  Shield,
  Building2,
  BarChart2,
} from "lucide-react";
import { BrandLogo } from "@/components/thakirni/brand-logo";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin",               icon: LayoutDashboard, label: "Dashboard",     group: "main" },
  { href: "/admin/analytics",     icon: BarChart2,       label: "Analytics",     group: "main" },
  { href: "/admin/users",         icon: Users,           label: "Users",         group: "main" },
  { href: "/admin/subscriptions", icon: CreditCard,      label: "Subscriptions", group: "main" },
  { href: "/admin/leads",         icon: Building2,       label: "Leads (CRM)",   group: "ops"  },
  { href: "/admin/discounts",     icon: Tag,             label: "Discounts",     group: "ops"  },
  { href: "/admin/announcements", icon: Megaphone,       label: "Announcements", group: "ops"  },
  { href: "/admin/jobs",          icon: ListTodo,        label: "Job Queue",     group: "sys"  },
  { href: "/admin/logs",          icon: ScrollText,      label: "Request Logs",  group: "sys"  },
  { href: "/admin/compliance",    icon: Shield,          label: "Compliance",    group: "sys"  },
  { href: "/admin/settings",      icon: Settings,        label: "Settings",      group: "sys"  },
];

const GROUP_LABELS: Record<string, string> = {
  main: "Overview",
  ops:  "Operations",
  sys:  "System",
};

interface AdminSidebarProps {
  fullName: string;
}

export function AdminSidebar({ fullName }: AdminSidebarProps) {
  const pathname = usePathname();

  const groups = Array.from(new Set(NAV_ITEMS.map((i) => i.group ?? "main")));

  return (
    <aside className="fixed inset-y-0 left-0 w-64 shell-panel-dark flex flex-col z-40 rounded-none border-l-0 border-t-0 border-b-0">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <BrandLogo variant="full" iconSize={28} />
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Admin Panel</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {groups.map((group) => {
          const items = NAV_ITEMS.filter((i) => (i.group ?? "main") === group);
          return (
            <div key={group}>
              <p className="px-3 mb-2 text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">
                {GROUP_LABELS[group] ?? group}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-amber-500/15 border border-amber-500/25 text-amber-400 shadow-sm shadow-amber-500/10"
                          : "text-white/50 hover:bg-white/6 hover:text-white/80 border border-transparent"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-amber-400" : "text-white/30")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User / footer */}
      <div className="p-4 border-t border-white/8 space-y-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/8">
          <div className="w-8 h-8 rounded-full power-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {fullName?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{fullName || "Admin"}</p>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
              <Shield className="w-2.5 h-2.5" />
              Admin
            </span>
          </div>
        </div>

        <Link
          href="/vault"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:bg-white/6 hover:text-white/60 border border-transparent hover:border-white/8 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Vault
        </Link>
      </div>
    </aside>
  );
}
