"use client";

import React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLanguage } from "@/components/language-provider";
import { useUser } from "@/components/user-provider";
import { BrandLogo } from "@/components/thakirni/brand-logo";

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { t, isArabic } = useLanguage();
  const { login } = useUser();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Login with dummy data for sign in
    login({
      name: "User",
      email: email,
      phone: "",
      plan: "Individual",
    });

    window.location.href = "/vault";
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    if (password !== confirmPassword) {
      setErrors({
        confirmPassword: t(
          "كلمات المرور غير متطابقة",
          "Passwords do not match",
        ),
      });
      setIsLoading(false);
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Save user data
    login({
      name,
      email,
      phone,
      plan: "Individual",
    });

    window.location.href = "/vault";
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950">
        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 islamic-pattern opacity-30" />

        {/* Decorative Elements */}
        <div className="absolute top-20 start-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 end-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full w-full p-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            {/* Logo */}
            <div className="mb-8">
              {/* Using icon variant for the sidebar-like decorative area, but larger */}
              <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-sm border border-white/10">
                <BrandLogo width={80} height={80} variant="icon" />
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white mb-4">
              {t("ذكرني", "Thakirni")}
            </h2>

            <p className="text-xl text-white/80 mb-8 font-english" dir="ltr">
              Your legacy, secured.
            </p>

            <div className="space-y-4 text-white/70 text-lg">
              <p>
                {t(
                  "ذاكرتك الثانية لحفظ كل اللحظات",
                  "Your second brain to preserve every moment",
                )}
              </p>
              <p className="font-english" dir="ltr">
                The second brain for your memories
              </p>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-col gap-3">
              {[
                {
                  ar: "تشفير كامل من البداية للنهاية",
                  en: "End-to-End Encryption",
                },
                { ar: "بيانات مستضافة في السعودية", en: "Saudi Hosted Data" },
                { ar: "خصوصية ١٠٠٪", en: "100% Privacy" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center gap-2 text-white/60 text-sm"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{t(item.ar, item.en)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t("العودة للرئيسية", "Back to Home")}</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md flex flex-col items-center"
          >
            {/* Mobile Logo for small screens */}
            <div className="lg:hidden text-center mb-8 flex flex-col items-center">
              <div className="mb-4">
                <BrandLogo width={60} height={60} variant="icon" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("ذكرني", "Thakirni")}
              </h1>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="signin">
                  {t("تسجيل الدخول", "Sign In")}
                </TabsTrigger>
                <TabsTrigger value="signup">
                  {t("حساب جديد", "Sign Up")}
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                {/* Sign In Form */}
                <TabsContent value="signin" className="space-y-6 w-full">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground">
                      {t("مرحباً بعودتك", "Welcome Back")}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      {t(
                        "سجّل دخولك للوصول لذكرياتك",
                        "Sign in to access your memories",
                      )}
                    </p>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4 w-full">
                    <div className="space-y-2 text-start">
                      <Label htmlFor="signin-email">
                        {t("البريد الإلكتروني", "Email Address")}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          name="email"
                          type="email"
                          placeholder="example@email.com"
                          className="ps-10"
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-start">
                      <Label htmlFor="signin-password">
                        {t("كلمة المرور", "Password")}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="ps-10 pe-10"
                          dir="ltr"
                          required
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
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <Link
                        href="/auth/forgot-password"
                        className="text-primary hover:underline"
                      >
                        {t("نسيت كلمة المرور؟", "Forgot password?")}
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading
                        ? t("جارٍ التحميل...", "Loading...")
                        : t("تسجيل الدخول", "Sign In")}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t("أو", "OR")}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-transparent"
                    type="button"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="font-english" dir="ltr">
                      {t("Continue with Google", "Continue with Google")}
                    </span>
                  </Button>
                </TabsContent>

                {/* Sign Up Form */}
                <TabsContent value="signup" className="space-y-6 w-full">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground">
                      {t("إنشاء حساب جديد", "Create an account")}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      {t(
                        "ابدأ رحلتك مع ذكرني",
                        "Start your journey with Thakirni",
                      )}
                    </p>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-4 w-full">
                    <div className="space-y-2 text-start">
                      <Label htmlFor="signup-name">
                        {t("الاسم الكامل", "Full Name")}
                      </Label>
                      <div className="relative">
                        <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          name="name"
                          type="text"
                          placeholder={t("محمد أحمد", "John Doe")}
                          className="ps-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-start">
                      <Label htmlFor="signup-phone">
                        {t("رقم الجوال", "Phone Number")}
                      </Label>
                      <div className="relative">
                        <Smartphone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          name="phone"
                          type="tel"
                          placeholder="050 000 0000"
                          className="ps-10"
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-start">
                      <Label htmlFor="signup-email">
                        {t("البريد الإلكتروني", "Email Address")}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder="example@email.com"
                          className="ps-10"
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-start">
                      <Label htmlFor="signup-password">
                        {t("كلمة المرور", "Password")}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="ps-10 pe-10"
                          dir="ltr"
                          required
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
                    </div>

                    <div className="space-y-2 text-start">
                      <Label htmlFor="signup-confirm">
                        {t("تأكيد كلمة المرور", "Confirm Password")}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm"
                          name="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className={`ps-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                          dir="ltr"
                          required
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading
                        ? t("جارٍ التحميل...", "Loading...")
                        : t("إنشاء الحساب", "Create Account")}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t("أو", "OR")}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full gap-2 border-2 hover:bg-muted"
                    type="button"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="font-english" dir="ltr">
                      {t("Continue with Google", "Continue with Google")}
                    </span>
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    {t(
                      "بإنشاء حساب، أنت توافق على",
                      "By creating an account, you agree to",
                    )}{" "}
                    <Link
                      href="/terms"
                      className="text-primary hover:underline"
                    >
                      {t("شروط الاستخدام", "Terms of Use")}
                    </Link>{" "}
                    {t("و", "and")}{" "}
                    <Link
                      href="/privacy"
                      className="text-primary hover:underline"
                    >
                      {t("سياسة الخصوصية", "Privacy Policy")}
                    </Link>
                  </p>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
