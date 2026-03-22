"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Plus, X, AlertTriangle } from "lucide-react";

interface PlanConfig {
  plan_key: string;
  display_name: string;
  price_sar: number;
  paddle_price_id: string | null;
  features: string[];
  is_active: boolean;
}

function PlanCard({
  plan: initialPlan,
  onSave,
}: {
  plan: PlanConfig;
  onSave: (updated: PlanConfig) => Promise<void>;
}) {
  const [plan, setPlan] = useState<PlanConfig>(initialPlan);
  const [newFeature, setNewFeature] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPlan(initialPlan);
  }, [initialPlan]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(plan);
      toast.success(`${plan.display_name} plan saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

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
    <div className="bg-[#f6f3f2] rounded-2xl p-6 flex flex-col gap-4">
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

      {/* Paddle Price ID */}
      <div className="space-y-1">
        <Label className="text-xs text-slate-500">Paddle Price ID</Label>
        <Input
          value={plan.paddle_price_id ?? ""}
          onChange={(e) =>
            setPlan((p) => ({ ...p, paddle_price_id: e.target.value || null }))
          }
          placeholder="pri_xxxx"
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
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl font-label"
        style={{ backgroundColor: accent, color: "white" }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save {plan.display_name} Plan
      </Button>
    </div>
  );
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function handleSavePlan(updated: PlanConfig) {
    const res = await fetch("/api/admin/plan-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planKey: updated.plan_key,
        displayName: updated.display_name,
        priceSar: updated.price_sar,
        paddlePriceId: updated.paddle_price_id,
        features: updated.features,
        isActive: updated.is_active,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error ?? "Save failed");
    }
    setPlans((prev) =>
      prev.map((p) => (p.plan_key === updated.plan_key ? updated : p))
    );
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
            <Skeleton key={i} className="h-[480px] rounded-2xl" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-[#f6f3f2] rounded-2xl p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#2552ca] mx-auto mb-3" />
          <p className="text-slate-500 font-label">Initializing plans...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.plan_key} plan={plan} onSave={handleSavePlan} />
          ))}
        </div>
      )}

      {/* Warning */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 font-label">
          <strong>Note:</strong> Changing prices here updates the display only. Update the
          Paddle dashboard manually to reflect billing changes.
        </p>
      </div>
    </div>
  );
}
