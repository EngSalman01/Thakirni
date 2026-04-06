"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, X, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PlanConfig {
  plan_key: string;
  display_name: string;
  price_sar: number;
  paddle_price_id: string | null;
  paddle_product_id: string | null;
  features: string[];
  is_active: boolean;
}

function PlanCard({
  plan: initialPlan,
  onSave,
}: {
  plan: PlanConfig;
  onSave: (updated: PlanConfig) => void;
}) {
  const [plan, setPlan] = useState<PlanConfig>(initialPlan);
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    setPlan(initialPlan);
  }, [initialPlan]);

  function addFeature() {
    if (!newFeature.trim()) return;
    setPlan((p) => ({ ...p, features: [...p.features, newFeature.trim()] }));
    setNewFeature("");
  }

  function removeFeature(idx: number) {
    setPlan((p) => ({
      ...p,
      features: p.features.filter((_, i) => i !== idx),
    }));
  }

  const accentMap: Record<string, string> = {
    free: "#64748b",
    pro: "#2552ca",
    teams: "#ad1d7f",
  };
  const accent = accentMap[plan.plan_key] ?? "#2552ca";

  return (
    <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div
          className="text-xs font-label font-bold uppercase tracking-widest px-2 py-1 rounded-md"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          {plan.plan_key}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-label text-slate-500">Active</span>
          <div dir="ltr">
            <Switch
              checked={plan.is_active}
              onCheckedChange={(v) => setPlan((p) => ({ ...p, is_active: v }))}
            />
          </div>
        </div>
      </div>

      {/* Display name */}
      <div className="space-y-1">
        <Label className="text-xs text-slate-500">Display Name</Label>
        <Input
          value={plan.display_name}
          onChange={(e) => setPlan((p) => ({ ...p, display_name: e.target.value }))}
          className="bg-white border-0 rounded-xl"
        />
      </div>

      {/* Price */}
      <div className="space-y-1">
        <Label className="text-xs text-slate-500">Price (SAR / month)</Label>
        <Input
          type="number"
          min={0}
          value={plan.price_sar}
          onChange={(e) =>
            setPlan((p) => ({ ...p, price_sar: parseFloat(e.target.value) || 0 }))
          }
          className="bg-white border-0 rounded-xl"
        />
      </div>

      {/* Features */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-500">Features</Label>
        <div className="space-y-1.5">
          {plan.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
              <span className="flex-1 text-sm font-label text-slate-700">{f}</span>
              <button
                onClick={() => removeFeature(i)}
                className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFeature()}
            placeholder="Add feature..."
            className="bg-white border-0 rounded-xl text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={addFeature}
            className="rounded-xl border-0 bg-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Save */}
      <Button
        onClick={() => onSave(plan)}
        className="w-full rounded-xl font-label"
        style={{ backgroundColor: accent, color: "white" }}
      >
        Save {plan.display_name} Plan
      </Button>
    </div>
  );
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Password confirmation dialog
  const [pendingPlan, setPendingPlan] = useState<PlanConfig | null>(null);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/admin/plan-config");
        if (res.ok) {
          const data = await res.json();
          setPlans(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load plans");
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  // Called by PlanCard — opens the password dialog instead of saving immediately
  function requestSave(updated: PlanConfig) {
    setPendingPlan(updated);
    setPassword("");
  }

  async function confirmSave() {
    if (!pendingPlan || !password) return;
    setVerifying(true);

    try {
      // Verify admin password by re-authenticating
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No session");

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (authError) {
        toast.error("Incorrect password");
        setVerifying(false);
        return;
      }

      // Password verified — proceed with save
      const res = await fetch("/api/admin/plan-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: pendingPlan.plan_key,
          displayName: pendingPlan.display_name,
          priceSar: pendingPlan.price_sar,
          paddlePriceId: pendingPlan.paddle_price_id,
          paddleProductId: pendingPlan.paddle_product_id,
          features: pendingPlan.features,
          isActive: pendingPlan.is_active,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Save failed");
      }

      setPlans((prev) =>
        prev.map((p) => (p.plan_key === pendingPlan.plan_key ? pendingPlan : p))
      );
      toast.success(`${pendingPlan.display_name} plan saved`);
      setPendingPlan(null);
      setPassword("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-slate-900">Subscriptions</h1>
        <p className="text-sm text-slate-500 font-label mt-1">
          Manage plan configuration and features
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[420px] rounded-2xl" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
          <p className="text-slate-500 font-label">Initializing plans...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.plan_key} plan={plan} onSave={requestSave} />
          ))}
        </div>
      )}

      {/* Password Confirmation Dialog */}
      <Dialog open={!!pendingPlan} onOpenChange={(open) => { if (!open) { setPendingPlan(null); setPassword(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Confirm Changes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-500 font-label">
              Enter your admin password to save changes to the{" "}
              <strong className="text-slate-800">{pendingPlan?.display_name}</strong> plan.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmSave()}
                autoFocus
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setPendingPlan(null); setPassword(""); }}
              disabled={verifying}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSave}
              disabled={verifying || !password}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
