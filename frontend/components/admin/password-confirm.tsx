"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";

/**
 * useAdminConfirm — call `confirm(label?)` before any destructive action.
 * Returns a Promise<boolean>: true = verified, false = cancelled.
 * Render <AdminConfirmDialog {...props} /> once anywhere in the page JSX.
 */
export function useAdminConfirm() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [label, setLabel] = useState<string | undefined>();
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((actionLabel?: string): Promise<boolean> => {
    return new Promise((res) => {
      setPassword("");
      setLabel(actionLabel);
      setOpen(true);
      resolveRef.current = res;
    });
  }, []);

  async function handleConfirm() {
    if (!password) return;
    setVerifying(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No session");

      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (error) {
        console.error("[AdminConfirm] signInWithPassword error:", error.message, error.status)
        const isRateLimit = error.status === 429 || error.message?.toLowerCase().includes("rate")
        toast.error(isRateLimit ? "Too many attempts — wait a moment and try again" : "Incorrect password")
        setVerifying(false);
        return;
      }

      setOpen(false);
      resolveRef.current?.(true);
    } catch {
      toast.error("Verification failed");
      setVerifying(false);
    }
  }

  function handleCancel() {
    setOpen(false);
    resolveRef.current?.(false);
  }

  const dialogProps = { open, password, setPassword, verifying, label, handleConfirm, handleCancel };

  return { confirm, dialogProps };
}

interface AdminConfirmDialogProps {
  open: boolean;
  password: string;
  setPassword: (v: string) => void;
  verifying: boolean;
  label?: string;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export function AdminConfirmDialog({
  open,
  password,
  setPassword,
  verifying,
  label,
  handleConfirm,
  handleCancel,
}: AdminConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#2552ca]" />
            Confirm Action
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-500 font-label">
            Enter your admin password to{" "}
            <strong className="text-slate-800">{label ?? "continue"}</strong>.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="admin-pw">Password</Label>
            <Input
              id="admin-pw"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              autoFocus
              className="rounded-xl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={verifying}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={verifying || !password}
            className="bg-[#2552ca] hover:bg-[#1e42a0] text-white"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
