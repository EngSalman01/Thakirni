"use client";

import { useState, useCallback, useRef } from "react";
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
      const res = await fetch("/api/admin/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Incorrect password");
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
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Confirm Action
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-500 font-label">
            Enter your admin password to{" "}
            <strong className="text-slate-200">{label ?? "continue"}</strong>.
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
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
