"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Loader2, RefreshCw, Info } from "lucide-react";

interface DiscountCode {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  plan_key: string | null;
  is_active: boolean;
  created_at: string;
}

function getStatus(d: DiscountCode): "active" | "expired" | "used_up" {
  if (!d.is_active) return "expired";
  if (d.max_uses > 0 && d.used_count >= d.max_uses) return "used_up";
  if (d.expires_at && new Date(d.expires_at) < new Date()) return "expired";
  return "active";
}

function StatusBadge({ status }: { status: "active" | "expired" | "used_up" }) {
  const styles = {
    active: "bg-green-100 text-green-700",
    expired: "bg-orange-100 text-orange-700",
    used_up: "bg-slate-100 text-slate-500",
  };
  const labels = { active: "Active", expired: "Expired", used_up: "Used Up" };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-label font-bold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DiscountsPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formDiscount, setFormDiscount] = useState<number>(10);
  const [formMaxUses, setFormMaxUses] = useState<number>(0);
  const [formExpiry, setFormExpiry] = useState("");
  const [formPlan, setFormPlan] = useState("all");

  async function fetchCodes() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discount-codes");
      if (res.ok) setCodes(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCodes();
  }, []);

  async function handleCreate() {
    if (!formCode.trim()) {
      toast.error("Code is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode,
          discountPercent: formDiscount,
          maxUses: formMaxUses,
          expiresAt: formExpiry || null,
          planKey: formPlan === "all" ? null : formPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      toast.success("Discount code created");
      setCreateOpen(false);
      resetForm();
      fetchCodes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateId) return;
    try {
      const res = await fetch(`/api/admin/discount-codes?id=${deactivateId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to deactivate");
      toast.success("Code deactivated");
      setDeactivateId(null);
      fetchCodes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  function resetForm() {
    setFormCode("");
    setFormDiscount(10);
    setFormMaxUses(0);
    setFormExpiry("");
    setFormPlan("all");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-slate-900">Discounts</h1>
          <p className="text-sm text-slate-500 font-label mt-1">
            Manage discount codes for checkout
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setCreateOpen(true); }}
          className="bg-[#2552ca] hover:bg-[#1e42a0] text-white rounded-xl font-label"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Code
        </Button>
      </div>

      {/* TODO info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 font-label">
          {/* Wire discount_code to Paddle checkout */}
          Discount codes are stored here. Wire them to the Paddle checkout flow to apply discounts at payment.
        </p>
      </div>

      {/* Table */}
      <div className="bg-[#f6f3f2] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e4e2e1]">
                {["Code", "Discount", "Uses", "Expires", "Plan", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left py-3 px-4 text-xs font-label font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="p-3">
                        <Skeleton className="h-10 rounded-xl" />
                      </td>
                    </tr>
                  ))
                : codes.map((c) => {
                    const status = getStatus(c);
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-[#e4e2e1]/50 last:border-0 hover:bg-white/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <code className="font-mono text-sm font-bold text-slate-800">
                            {c.code}
                          </code>
                        </td>
                        <td className="py-3 px-4 font-label font-semibold text-[#2552ca]">
                          {c.discount_percent}%
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {c.used_count}/{c.max_uses === 0 ? "∞" : c.max_uses}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {formatDate(c.expires_at)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs capitalize">
                          {c.plan_key ?? "All"}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={status} />
                        </td>
                        <td className="py-3 px-4">
                          {status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs rounded-lg border-slate-200"
                              onClick={() => setDeactivateId(c.id)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              {!loading && codes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-label">
                    No discount codes yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Discount Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Code */}
            <div className="space-y-1.5">
              <Label>Code</Label>
              <div className="flex gap-2">
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="SAVE20"
                  className="font-mono uppercase"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormCode(generateCode())}
                  className="rounded-xl flex-shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Generate
                </Button>
              </div>
            </div>

            {/* Discount % */}
            <div className="space-y-1.5">
              <Label>Discount %</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={formDiscount}
                onChange={(e) => setFormDiscount(parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Max uses */}
            <div className="space-y-1.5">
              <Label>Max Uses</Label>
              <Input
                type="number"
                min={0}
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(parseInt(e.target.value) || 0)}
                placeholder="0 = unlimited"
              />
              <p className="text-xs text-slate-400">0 = unlimited</p>
            </div>

            {/* Expiry */}
            <div className="space-y-1.5">
              <Label>Expiry Date (optional)</Label>
              <Input
                type="date"
                value={formExpiry}
                onChange={(e) => setFormExpiry(e.target.value)}
              />
            </div>

            {/* Plan */}
            <div className="space-y-1.5">
              <Label>Applies To</Label>
              <Select value={formPlan} onValueChange={setFormPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="teams">Teams</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-[#2552ca] hover:bg-[#1e42a0] text-white"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirm */}
      <AlertDialog open={!!deactivateId} onOpenChange={(o) => !o && setDeactivateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Code</AlertDialogTitle>
            <AlertDialogDescription>
              This will disable the discount code. Users will no longer be able to use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
