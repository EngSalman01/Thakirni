"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/thakirni/brand-logo";
import { useLanguage } from "@/components/language-provider";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("كلمة المرور لازم تكون ٨ أحرف على الأقل", "Password must be at least 8 characters."));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("كلمتا المرور غير متطابقتين", "Passwords do not match."));
      return;
    }

    setIsLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/vault"), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#fbf9f8" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-2xl p-8 shadow-sm bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>

          <div className="flex flex-col items-center mb-8">
            <BrandLogo className="h-10 w-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground">
              {t("تعيين كلمة مرور جديدة", "Set a new password")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              {t("أدخل كلمة مرور جديدة لحسابك", "Enter a new password for your account")}
            </p>
          </div>

          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-4 text-center"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="font-semibold text-slate-800">
                {t("تم تغيير كلمة المرور!", "Password updated!")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("جارٍ تحويلك...", "Redirecting you...")}
              </p>
            </motion.div>
          ) : (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-3 rounded-xl flex items-center gap-2 text-sm"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {t("كلمة المرور الجديدة", "New password")} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      className="ps-10 pe-10"
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {t("تأكيد كلمة المرور", "Confirm password")} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="ps-10 pe-10"
                      dir="ltr"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  type="submit" disabled={isLoading}
                  className="w-full py-2.5 rounded-xl font-semibold text-white transition-opacity disabled:opacity-60 mt-2"
                  style={{ background: "linear-gradient(135deg, #D97706 0%, #FBBF24 100%)", boxShadow: "0 4px 20px rgba(217,119,6,0.35)" }}
                >
                  {isLoading
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        {t("جارٍ الحفظ...", "Saving...")}
                      </span>
                    : t("حفظ كلمة المرور", "Save password")}
                </motion.button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
