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
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/subscriptions", icon: CreditCard, label: "Subscriptions" },
  { href: "/admin/leads",     icon: Building2, label: "Leads (CRM)" },
  { href: "/admin/discounts", icon: Tag,       label: "Discounts" },
  { href: "/admin/announcements", icon: Megaphone, label: "Announcements" },
  { href: "/admin/jobs", icon: ListTodo, label: "Job Queue" },
  { href: "/admin/logs", icon: ScrollText, label: "Request Logs" },
  { href: "/admin/compliance", icon: Shield, label: "Compliance" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

interface AdminSidebarProps {
  fullName: string;
}

export function AdminSidebar({ fullName }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-[#e4e2e1] flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-[#e4e2e1]">
        <BrandLogo />
        <p className="text-xs font-label font-semibold text-[#2552ca] uppercase tracking-widest mt-3">
          Admin Panel
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
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
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-label font-medium transition-all",
                isActive
                  ? "bg-[#2552ca] text-white shadow-sm"
                  : "text-slate-600 hover:bg-[#f6f3f2] hover:text-slate-900"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / footer */}
      <div className="p-4 border-t border-[#e4e2e1] space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-[#2552ca] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {fullName?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-label font-semibold text-slate-800 truncate">
              {fullName || "Admin"}
            </p>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
              Admin
            </span>
          </div>
        </div>

        <Link
          href="/vault"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-label text-slate-500 hover:bg-[#f6f3f2] hover:text-slate-700 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Vault
        </Link>
      </div>
    </aside>
  );
}
