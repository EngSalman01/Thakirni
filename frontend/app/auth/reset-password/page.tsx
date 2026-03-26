"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const redirectTo =
      (typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? "") + "/auth/update-password";

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo },
    );

    if (resetError) {
      setError(resetError.message);
      setIsLoading(false);
      return;
    }

    setDone(true);
    setIsLoading(false);
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
                  {t("تحقق من إيميلك", "Check your email")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "أرسلنا لك رابط إعادة تعيين كلمة المرور، راجع إيميلك وافتح الرابط.",
                    "We sent you a password reset link. Check your email and open the link.",
                  )}
                </p>
                <Button
                  variant="outline"
                  asChild
                >
                  <Link href="/auth">
                    {t("ارجع لتسجيل الدخول", "Back to Sign In")}
                  </Link>
                </Button>
              </motion.div>
            ) : (
              /* ── Form ── */
              <div className="space-y-5">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    {t("نسيت كلمة المرور؟", "Forgot Password?")}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t(
                      "ادخل بريدك الإلكتروني وراح نرسل لك رابط إعادة التعيين",
                      "Enter your email and we'll send you a reset link",
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
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      {t("البريد الإلكتروني", "Email")} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        className="ps-10"
                        dir="ltr"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
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
                      ? t("جارٍ الإرسال...", "Sending...")
                      : t("إرسال رابط إعادة التعيين", "Send Reset Link")}
                  </motion.button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  {t("تذكرت كلمة المرور؟", "Remembered your password?")}{" "}
                  <Link
                    href="/auth"
                    className="font-medium hover:underline"
                    style={{ color: "#2552ca" }}
                  >
                    {t("سجّل دخولك", "Sign in")}
                  </Link>
                </p>
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
