"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAdminConfirm, AdminConfirmDialog } from "@/components/admin/password-confirm";

interface AppConfig {
  app_name: string;
  support_whatsapp: string;
  maintenance_mode: string;
  admin_email: string;
}

const SQL_SETUP = `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- To grant admin access:
UPDATE profiles SET is_admin = true WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');`;

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<AppConfig>({
    app_name: "Thakirni",
    support_whatsapp: "",
    maintenance_mode: "false",
    admin_email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { confirm, dialogProps } = useAdminConfirm();

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/admin/app-config");
        if (res.ok) {
          const data = await res.json();
          setConfig((prev) => ({ ...prev, ...data }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  async function handleSave() {
    const ok = await confirm("save settings");
    if (!ok) return;
    setSaving(true);
    try {
      const entries = Object.entries(config);
      await Promise.all(
        entries.map(([key, value]) =>
          fetch("/api/admin/app-config", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value }),
          })
        )
      );
      toast.success("Settings saved");
    } catch (e) {
      toast.error("Failed to save settings");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 font-label mt-1">
          App-wide configuration
        </p>
      </div>

      {/* Config form */}
      <div className="bg-white/[0.04] rounded-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>App Name</Label>
          <Input
            value={config.app_name}
            onChange={(e) => setConfig((c) => ({ ...c, app_name: e.target.value }))}
            className="bg-white/[0.07] border border-white/[0.10] rounded-xl text-white"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Support WhatsApp Number</Label>
          <Input
            value={config.support_whatsapp}
            onChange={(e) =>
              setConfig((c) => ({ ...c, support_whatsapp: e.target.value }))
            }
            placeholder="+966xxxxxxxxx"
            className="bg-white/[0.07] border border-white/[0.10] rounded-xl text-white"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Admin Email</Label>
          <Input
            type="email"
            value={config.admin_email}
            onChange={(e) => setConfig((c) => ({ ...c, admin_email: e.target.value }))}
            placeholder="admin@example.com"
            className="bg-white/[0.07] border border-white/[0.10] rounded-xl text-white"
          />
        </div>

        {/* Maintenance mode */}
        <div className="flex items-start justify-between gap-4 p-4 bg-white rounded-xl">
          <div>
            <p className="font-label font-bold text-sm text-slate-200">Maintenance Mode</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Show maintenance page to non-admin /vault users
            </p>
          </div>
          <div dir="ltr" className="flex-shrink-0 pt-0.5">
            <Switch
              checked={config.maintenance_mode === "true"}
              onCheckedChange={(v) =>
                setConfig((c) => ({ ...c, maintenance_mode: v ? "true" : "false" }))
              }
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-label"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save All
        </Button>
      </div>

      <AdminConfirmDialog {...dialogProps} />

      {/* Database Setup */}
      <div className="bg-white/[0.04] rounded-2xl p-6 space-y-3">
        <h2 className="text-base font-headline font-semibold text-white">
          Database Setup
        </h2>
        <p className="text-sm text-slate-500 font-label">
          Run these SQL commands in the Supabase SQL Editor to enable admin functionality.
        </p>
        <pre className="bg-slate-900 text-green-400 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
          {SQL_SETUP}
        </pre>
      </div>
    </div>
  );
}
