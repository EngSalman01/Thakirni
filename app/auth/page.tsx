"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye, EyeOff, Mail, Lock, User,
  ArrowLeft, AlertCircle, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLanguage } from "@/components/language-provider";
import { BrandLogo } from "@/components/thakirni/brand-logo";
import { createClient } from "@/lib/supabase/client";

// ── Password strength ────────────────────────────────────────────────────────

function getPasswordStrength(password: string): {
  score: number;   // 0-4
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const clipped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;

  const map = {
    0: { label: "Too short", color: "bg-destructive" },
    1: { label: "Weak", color: "bg-destructive" },
    2: { label: "Fair", color: "bg-yellow-500" },
    3: { label: "Good", color: "bg-blue-500" },
    4: { label: "Strong", color: "bg-green-500" },
  };

  return { score: clipped, ...map[clipped] };
}

// ── Auth Form ────────────────────────────────────────────────────────────────

function AuthForm() {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [showSignInPw, setShowSignInPw] = useState(false);  // separate per form
  const [showSignUpPw, setShowSignUpPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signUpDone, setSignUpDone] = useState(false);  // email-confirm screen
  const [signUpPassword, setSignUpPassword] = useState(""); // for strength meter

  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const router = useRouter();
  const supabase = createClient();

  const strength = getPasswordStrength(signUpPassword);

  // ── Sign In ────────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim().toLowerCase();
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Friendlier messages than Supabase's raw strings
      const msg =
        error.message.includes("Invalid login credentials")
          ? t("البريد أو كلمة المرور غير صحيحة", "Incorrect email or password.")
          : error.message;
      setErrors({ form: msg });
      setIsLoading(false);
      return;
    }

    router.push(nextUrl || "/vault");
  };

  // ── Sign Up ────────────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const email = (formData.get("email") as string).trim().toLowerCase();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Client-side validation
    if (password.length < 8) {
      setErrors({ password: t("كلمة المرور يجب أن تكون 8 أحرف على الأقل", "Password must be at least 8 characters.") });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: t("كلمات المرور غير متطابقة", "Passwords do not match.") });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, avatar_url: "" } },
    });

    if (error) {
      const msg =
        error.message.includes("already registered")
          ? t("هذا البريد مسجل مسبقاً، جرّب تسجيل الدخول", "This email is already registered. Try signing in.")
          : error.message;
      setErrors({ form: msg });
      setIsLoading(false);
      return;
    }

    // Show email-confirmation notice instead of redirecting
    setSignUpDone(true);
    setIsLoading(false);
  };

  // ── Google ─────────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${nextUrl || "/vault"}` },
    });
    // No need to reset loading — page will redirect
  };

  // ── Email confirm screen ───────────────────────────────────────────────────
  if (signUpDone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center space-y-4 flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {t("تحقق من بريدك الإلكتروني", "Check your email")}
        </h2>
        <p className="text-muted-foreground">
          {t(
            "أرسلنا لك رابط تأكيد، يرجى التحقق من بريدك الإلكتروني للمتابعة.",
            "We sent you a confirmation link. Please check your email to continue.",
          )}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => { setSignUpDone(false); setActiveTab("signin"); }}
        >
          {t("العودة لتسجيل الدخول", "Back to Sign In")}
        </Button>
      </motion.div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md flex flex-col items-center"
    >
      {/* Mobile Logo */}
      <div className="lg:hidden text-center mb-8 flex flex-col items-center">
        <div className="mb-4">
          <BrandLogo width={60} height={60} variant="icon" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("ذكرني", "Thakirni")}
        </h1>
      </div>

      <div className="w-full">
        {/* Tabs */}
        <div className="grid w-full grid-cols-2 mb-8 gap-2">
          {(["signin", "signup"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); setErrors({}); }}
              className={`py-2 px-4 rounded-md font-medium transition-colors ${activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {tab === "signin"
                ? t("تسجيل الدخول", "Sign In")
                : t("حساب جديد", "Sign Up")}
            </button>
          ))}
        </div>

        {/* Global error */}
        <AnimatePresence>
          {errors.form && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errors.form}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SIGN IN ── */}
        {activeTab === "signin" && (
          <div className="space-y-6 w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {t("مرحباً بعودتك", "Welcome Back")}
              </h2>
              <p className="text-muted-foreground mt-1">
                {t("سجّل دخولك للوصول لذكرياتك", "Sign in to access your memories")}
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4 w-full">
              <div className="space-y-2 text-start">
                <Label htmlFor="signin-email">{t("البريد الإلكتروني", "Email Address")}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="signin-email" name="email" type="email"
                    placeholder="example@email.com" className="ps-10" dir="ltr" required />
                </div>
              </div>

              <div className="space-y-2 text-start">
                <Label htmlFor="signin-password">{t("كلمة المرور", "Password")}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="signin-password" name="password"
                    type={showSignInPw ? "text" : "password"}
                    placeholder="••••••••" className="ps-10 pe-10" dir="ltr" required />
                  <button type="button"
                    onClick={() => setShowSignInPw(!showSignInPw)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showSignInPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end text-sm">
                <Link href="/auth/forgot-password" className="text-primary hover:underline">
                  {t("نسيت كلمة المرور؟", "Forgot password?")}
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("جارٍ التحميل...", "Loading...") : t("تسجيل الدخول", "Sign In")}
              </Button>
            </form>
          </div>
        )}

        {/* ── SIGN UP ── */}
        {activeTab === "signup" && (
          <div className="space-y-6 w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {t("إنشاء حساب جديد", "Create an account")}
              </h2>
              <p className="text-muted-foreground mt-1">
                {t("ابدأ رحلتك مع ذكرني", "Start your journey with Thakirni")}
              </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4 w-full">
              {/* Full Name */}
              <div className="space-y-2 text-start">
                <Label htmlFor="signup-name">{t("الاسم الكامل", "Full Name")}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="signup-name" name="name" type="text"
                    placeholder={t("محمد أحمد", "John Doe")} className="ps-10" required />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2 text-start">
                <Label htmlFor="signup-email">{t("البريد الإلكتروني", "Email Address")}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="signup-email" name="email" type="email"
                    placeholder="example@email.com" className="ps-10" dir="ltr" required />
                </div>
              </div>

              {/* Password + strength meter */}
              <div className="space-y-2 text-start">
                <Label htmlFor="signup-password">{t("كلمة المرور", "Password")}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="signup-password" name="password"
                    type={showSignUpPw ? "text" : "password"}
                    placeholder="••••••••" className="ps-10 pe-10" dir="ltr"
                    required minLength={8}
                    onChange={(e) => setSignUpPassword(e.target.value)} />
                  <button type="button"
                    onClick={() => setShowSignUpPw(!showSignUpPw)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showSignUpPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength bar */}
                {signUpPassword.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength.score ? strength.color : "bg-muted"
                            }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{strength.label}</p>
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2 text-start">
                <Label htmlFor="signup-confirm">{t("تأكيد كلمة المرور", "Confirm Password")}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="signup-confirm" name="confirmPassword"
                    type={showSignUpPw ? "text" : "password"}
                    placeholder="••••••••"
                    className={`ps-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                    dir="ltr" required />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? t("جارٍ التحميل...", "Loading...")
                  : t("إنشاء الحساب", "Create Account")}
              </Button>
            </form>
          </div>
        )}

        {/* Google */}
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t("أو", "OR")}</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2 bg-transparent mt-6"
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          <span className="font-english" dir="ltr">
            {t("Continue with Google", "Continue with Google")}
          </span>
        </Button>
      </div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex">
      {/* Left Column */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
        </div>
        <div className="absolute top-20 start-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 end-20 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center items-center h-full w-full p-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="mb-8">
              <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-sm border border-white/10">
                <BrandLogo size="lg" variant="icon" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">{t("ذكرني", "Thakirni")}</h2>
            <p className="text-xl text-white/80 mb-8 font-english" dir="ltr">Your legacy, secured.</p>
            <div className="space-y-4 text-white/70 text-lg">
              <p>{t("ذاكرتك الثانية لحفظ كل اللحظات", "Your second brain to preserve every moment")}</p>
            </div>
            <div className="mt-12 flex flex-col gap-3">
              {[
                { ar: "تشفير كامل من البداية للنهاية", en: "End-to-End Encryption" },
                { ar: "بيانات مستضافة في السعودية", en: "Saudi Hosted Data" },
                { ar: "خصوصية ١٠٠٪", en: "100% Privacy" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{t(item.ar, item.en)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t("العودة للرئيسية", "Back to Home")}</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <Suspense fallback={
            <div className="flex items-center justify-center w-full h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
            </div>
          }>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}