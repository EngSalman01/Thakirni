"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye, EyeOff, Mail, Lock, User, Phone,
  ArrowLeft, AlertCircle, CheckCircle2, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";

// ── Password strength ─────────────────────────────────────────────────────────

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const clipped = Math.min(score, 4) as 0|1|2|3|4;
  const map = {
    0: { label: "قصيرة جداً", color: "bg-red-500" },
    1: { label: "ضعيفة",      color: "bg-red-500" },
    2: { label: "متوسطة",     color: "bg-yellow-500" },
    3: { label: "جيدة",       color: "bg-blue-500" },
    4: { label: "قوية",       color: "bg-green-500" },
  };
  return { score: clipped, ...map[clipped] };
}

// ── Auth Form ─────────────────────────────────────────────────────────────────

function AuthForm() {
  const [tab, setTab]                   = useState<"signin" | "signup">("signin");
  const [showSignInPw, setShowSignInPw] = useState(false);
  const [showSignUpPw, setShowSignUpPw] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [signUpDone, setSignUpDone]     = useState(false);
  const [signUpPassword, setSignUpPassword] = useState("");
  const [phoneNumber, setPhoneNumber]   = useState("");

  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const router  = useRouter();
  const supabase = createClient();
  const strength = getPasswordStrength(signUpPassword);

  // ── Sign In ──────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    const fd    = new FormData(e.currentTarget);
    const email = (fd.get("email") as string).trim().toLowerCase();
    const pw    = fd.get("password") as string;
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) {
      setErrors({ form: error.message.includes("Invalid login credentials")
        ? t("البريد أو كلمة المرور غلط، حاول مرة ثانية", "Incorrect email or password.")
        : error.message });
      setIsLoading(false);
      return;
    }
    router.push(nextUrl || "/vault");
  };

  // ── Sign Up ──────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    const fd              = new FormData(e.currentTarget);
    const name            = (fd.get("name") as string).trim();
    const email           = (fd.get("email") as string).trim().toLowerCase();
    const pw              = fd.get("password") as string;
    const confirmPw       = fd.get("confirmPassword") as string;

    if (pw.length < 8) {
      setErrors({ password: t("كلمة المرور لازم تكون ٨ أحرف على الأقل", "Password must be at least 8 characters.") });
      setIsLoading(false);
      return;
    }
    if (pw !== confirmPw) {
      setErrors({ confirmPassword: t("كلمات المرور ما تطابقت، حاول مرة ثانية", "Passwords do not match.") });
      setIsLoading(false);
      return;
    }

    // Normalize phone if provided
    const rawPhone = phoneNumber.trim().replace(/\s+/g, "");
    const normPhone = rawPhone
      ? rawPhone.replace(/^\+/, "").replace(/^00/, "").replace(/^0/, "966")
      : null;

    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: {
        data: {
          full_name: name,
          avatar_url: "",
          phone_number: normPhone,   // profile trigger picks this up
        },
      },
    });
    if (error) {
      setErrors({ form: error.message.includes("already registered")
        ? t("هذا الإيميل مسجل قبل كذا، سجّل دخولك", "This email is already registered. Try signing in.")
        : error.message });
      setIsLoading(false);
      return;
    }

    setSignUpDone(true);
    setIsLoading(false);
  };

  // ── Google ───────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${nextUrl || "/vault"}` },
    });
  };

  // ── Email confirm screen ─────────────────────────────────────────
  if (signUpDone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center space-y-5 flex flex-col items-center"
      >
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #2552ca22 0%, #fd65c222 100%)" }}>
          <CheckCircle2 className="w-10 h-10" style={{ color: "#2552ca" }} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {t("تحقق من إيميلك", "Check your email")}
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          {t(
            "أرسلنا لك رابط التأكيد، راجع إيميلك وافتح الرابط عشان تكمل التسجيل.",
            "We sent you a confirmation link. Check your email to continue.",
          )}
        </p>
        <Button variant="outline" onClick={() => { setSignUpDone(false); setTab("signin"); }}>
          {t("ارجع لتسجيل الدخول", "Back to Sign In")}
        </Button>
      </motion.div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      {/* Logo (mobile) */}
      <div className="lg:hidden text-center mb-8">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #2552ca 0%, #fd65c2 100%)" }}>
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">ذكرني</h1>
      </div>

      {/* Google — primary CTA */}
      <motion.button
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        type="button" onClick={handleGoogleLogin} disabled={isGoogleLoading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm disabled:opacity-60 mb-5 shadow-sm hover:shadow-md transition-all"
        style={{ background: "linear-gradient(135deg, #2552ca08 0%, #fd65c210 100%)", border: "1.5px solid rgba(37,82,202,0.2)" }}
      >
        {isGoogleLoading
          ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )
        }
        <span>{t("متابعة بحساب Google", "Continue with Google")}</span>
      </motion.button>

      {/* Divider */}
      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-wide">
            {t("أو بالبريد الإلكتروني", "or with email")}
          </span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl mb-8"
        style={{ background: "rgba(37, 82, 202, 0.06)" }}>
        {(["signin", "signup"] as const).map((t_) => (
          <button key={t_} type="button"
            onClick={() => { setTab(t_); setErrors({}); }}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
            style={tab === t_
              ? { background: "linear-gradient(135deg, #2552ca 0%, #fd65c2 100%)", color: "#fff", boxShadow: "0 2px 12px rgba(37,82,202,0.3)" }
              : { color: "#6b7280" }
            }
          >
            {t_ === "signin" ? t("تسجيل الدخول", "Sign In") : t("حساب جديد", "Sign Up")}
          </button>
        ))}
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {errors.form && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-5 p-3 rounded-xl flex items-center gap-2 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errors.form}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SIGN IN ── */}
      {tab === "signin" && (
        <div className="space-y-5">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {t("أهلاً وسهلاً", "Welcome Back")}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {t("سجّل دخولك وارجع لذكرياتك", "Sign in to access your vault")}
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("البريد الإلكتروني", "Email")}</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input name="email" type="email" placeholder="example@email.com"
                  className="ps-10" dir="ltr" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t("كلمة المرور", "Password")}</Label>
                <Link href="/auth/forgot-password"
                  className="text-xs hover:underline" style={{ color: "#2552ca" }}>
                  {t("نسيت كلمة المرور؟", "Forgot password?")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input name="password" type={showSignInPw ? "text" : "password"}
                  placeholder="••••••••" className="ps-10 pe-10" dir="ltr" required />
                <button type="button" onClick={() => setShowSignInPw(!showSignInPw)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showSignInPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              type="submit" disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #2552ca 0%, #fd65c2 100%)", boxShadow: "0 4px 20px rgba(37,82,202,0.35)" }}
            >
              {isLoading ? t("جارٍ الدخول...", "Signing in...") : t("دخول", "Sign In")}
            </motion.button>
          </form>
        </div>
      )}

      {/* ── SIGN UP ── */}
      {tab === "signup" && (
        <div className="space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {t("ابدأ رحلتك", "Create Your Account")}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {t("سجّل وابدأ تحفظ ذكرياتك", "Sign up and start preserving your memories")}
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("الاسم الكامل", "Full Name")}</Label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input name="name" type="text" placeholder={t("محمد العمري", "John Doe")}
                  className="ps-10" required />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("البريد الإلكتروني", "Email")}</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input name="email" type="email" placeholder="example@email.com"
                  className="ps-10" dir="ltr" required />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {t("رقم الجوال", "Phone")}
                <span className="text-muted-foreground text-xs ms-1.5">
                  {t("(اختياري - للواتساب)", "(optional — WhatsApp)")}
                </span>
              </Label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input name="phone" type="tel" placeholder="05xxxxxxxx"
                  className="ps-10" dir="ltr"
                  value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("كلمة المرور", "Password")}</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input name="password" type={showSignUpPw ? "text" : "password"}
                  placeholder="••••••••" className="ps-10 pe-10" dir="ltr" required minLength={8}
                  onChange={(e) => setSignUpPassword(e.target.value)} />
                <button type="button" onClick={() => setShowSignUpPw(!showSignUpPw)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showSignUpPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {signUpPassword.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-muted"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{strength.label}</p>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("تأكيد كلمة المرور", "Confirm Password")}</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input name="confirmPassword" type={showSignUpPw ? "text" : "password"}
                  placeholder="••••••••"
                  className={`ps-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                  dir="ltr" required />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              type="submit" disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-semibold text-white transition-opacity disabled:opacity-60 mt-2"
              style={{ background: "linear-gradient(135deg, #2552ca 0%, #fd65c2 100%)", boxShadow: "0 4px 20px rgba(37,82,202,0.35)" }}
            >
              {isLoading ? t("جارٍ التسجيل...", "Creating account...") : t("إنشاء حساب", "Create Account")}
            </motion.button>
          </form>
        </div>
      )}

    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex" style={{ background: "#fbf9f8" }}>

      {/* ── Left panel: Cognitive Aura ────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a2a6c 0%, #2552ca 40%, #ad1d7f 75%, #fd65c2 100%)" }}>

        {/* Mesh blobs */}
        <motion.div className="absolute top-10 left-10 w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, #fd65c2 0%, transparent 70%)" }}
          animate={{ y: [0, -25, 0], x: [0, 15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #2552ca 0%, transparent 70%)" }}
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }} />

        <div className="relative z-10 flex flex-col justify-center items-center h-full w-full p-14 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }} className="flex flex-col items-center">

            {/* Aura sphere */}
            <motion.div className="relative mb-10"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <div className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(12px)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  boxShadow: "0 0 50px rgba(253,101,194,0.4), 0 0 100px rgba(37,82,202,0.3)",
                }}>
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              {/* Orbital ring */}
              <motion.div className="absolute inset-[-12px] rounded-full border border-white/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
            </motion.div>

            <h2 className="text-5xl font-bold text-white mb-3 tracking-tight">ذكرني</h2>
            <p className="text-white/70 text-lg mb-10 font-light" dir="ltr">Your second brain. Yours forever.</p>

            {/* Feature pills */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {[
                { ar: "ذاكرتك الثانية تحفظ كل شيء",  icon: "🧠" },
                { ar: "تشفير كامل وخصوصية تامة",       icon: "🔒" },
                { ar: "مساعد ذكي يفهم بالسعودي",       icon: "✨" },
                { ar: "بيانات مستضافة في السعودية",    icon: "🇸🇦" },
              ].map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/90"
                  style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
                  <span className="text-base">{item.icon}</span>
                  <span>{item.ar}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel: Form ─────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <Link href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t("الرئيسية", "Home")}
          </Link>
          {/* Language/theme slot */}
          <div />
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Suspense fallback={
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          }>
            <AuthForm />
          </Suspense>
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
