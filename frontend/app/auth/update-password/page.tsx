"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(
        t(
          "كلمة المرور لازم تكون ٨ أحرف على الأقل",
          "Password must be at least 8 characters.",
        ),
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        t("كلمات المرور ما تطابقت، حاول مرة ثانية", "Passwords do not match."),
      );
      return;
    }

    setIsLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    setDone(true);
    setIsLoading(false);

    setTimeout(() => {
      router.push("/vault");
    }, 2000);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#fbf9f8" }}>

      {/* ── Left panel ──────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1a2a6c 0%, #2552ca 40%, #ad1d7f 75%, #fd65c2 100%)",
        }}
      >
        {/* Mesh blobs */}
        <motion.div
          className="absolute top-10 left-10 w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, #fd65c2 0%, transparent 70%)" }}
          animate={{ y: [0, -25, 0], x: [0, 15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #2552ca 0%, transparent 70%)" }}
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <div className="relative z-10 flex flex-col justify-center items-center h-full w-full p-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <motion.div
              className="relative mb-10"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(12px)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  boxShadow:
                    "0 0 50px rgba(253,101,194,0.4), 0 0 100px rgba(37,82,202,0.3)",
                }}
              >
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <motion.div
                className="absolute inset-[-12px] rounded-full border border-white/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>

            <h2 className="text-5xl font-bold text-white mb-3 tracking-tight">ذكرني</h2>
            <p className="text-white/70 text-lg font-light" dir="ltr">
              Your second brain. Yours forever.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <Link
            href="/auth"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t("تسجيل الدخول", "Sign In")}
          </Link>
          <div />
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Logo (mobile) */}
            <div className="lg:hidden text-center mb-8">
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #2552ca 0%, #fd65c2 100%)",
                }}
              >
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">ذكرني</h1>
            </div>

            {done ? (
              /* ── Success state ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 flex flex-col items-center"
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #2552ca22 0%, #fd65c222 100%)",
                  }}
                >
                  <CheckCircle2 className="w-10 h-10" style={{ color: "#2552ca" }} />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  {t("تم تحديث كلمة المرور!", "Password updated!")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "كلمة مرورك الجديدة جاهزة، بيتم تحويلك للخزنة الآن...",
                    "Your new password is set. Redirecting you to the vault...",
                  )}
                </p>
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </motion.div>
            ) : (
              /* ── Form ── */
              <div className="space-y-5">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    {t("تعيين كلمة مرور جديدة", "Set New Password")}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t(
                      "اختر كلمة مرور قوية لحمايه حسابك",
                      "Choose a strong password to secure your account",
                    )}
                  </p>
                </div>

                {/* Error banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2 p-3 rounded-xl flex items-center gap-2 text-sm"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444",
                    }}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New password */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      {t("كلمة المرور الجديدة", "New Password")}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="ps-10 pe-10"
                        dir="ltr"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("على الأقل ٨ أحرف", "At least 8 characters")}
                    </p>
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      {t("تأكيد كلمة المرور", "Confirm Password")}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        className="ps-10 pe-10"
                        dir="ltr"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl font-semibold text-white transition-opacity disabled:opacity-60"
                    style={{
                      background:
                        "linear-gradient(135deg, #2552ca 0%, #fd65c2 100%)",
                      boxShadow: "0 4px 20px rgba(37,82,202,0.35)",
                    }}
                  >
                    {isLoading
                      ? t("جارٍ الحفظ...", "Saving...")
                      : t("حفظ كلمة المرور", "Save Password")}
                  </motion.button>
                </form>
              </div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-6">
          {t("بالتسجيل أنت توافق على", "By signing up you agree to our")}{" "}
          <Link href="/privacy" className="hover:underline" style={{ color: "#2552ca" }}>
            {t("سياسة الخصوصية", "Privacy Policy")}
          </Link>
        </p>
      </div>
    </div>
  );
}
