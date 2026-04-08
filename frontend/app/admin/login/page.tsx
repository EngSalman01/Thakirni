"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, AlertCircle, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function AdminLoginPage() {
  const [showPw, setShowPw]         = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef                  = useRef<HCaptcha>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const fd       = new FormData(e.currentTarget);
    const email    = (fd.get("email") as string).trim().toLowerCase();
    const password = fd.get("password") as string;

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email, password,
      options: { captchaToken: captchaToken || undefined },
    });
    if (signInError || !authData.user) {
      captchaRef.current?.resetCaptcha();
      setCaptchaToken("");
      setError("البريد أو كلمة المرور غلط");
      setIsLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", authData.user.id)
      .single();

    if (profile?.is_admin !== true) {
      await supabase.auth.signOut();
      setError("ما عندك صلاحية الوصول لهذه الصفحة");
      setIsLoading(false);
      return;
    }

    router.push("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E0B07]">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-amber-600/6 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Card */}
        <div className="rounded-2xl p-8 bg-white/[0.04] border border-white/[0.08] shadow-2xl">

          {/* Icon + title */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl power-gradient flex items-center justify-center mb-4 shadow-lg shadow-amber-900/30">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">لوحة التحكم</h1>
            <p className="text-sm text-slate-500 mt-1">Admin Panel</p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-5 p-3 rounded-xl flex items-center gap-2 text-sm bg-red-500/10 border border-red-500/20 text-red-400"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-300">
                البريد الإلكتروني <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input name="email" type="email" placeholder="admin@example.com"
                  className="ps-10 bg-white/[0.06] border-white/[0.10] text-white placeholder:text-slate-600 focus:border-amber-500/50"
                  dir="ltr" required autoComplete="email" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-300">
                كلمة المرور <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input name="password" type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  className="ps-10 pe-10 bg-white/[0.06] border-white/[0.10] text-white placeholder:text-slate-600 focus:border-amber-500/50"
                  dir="ltr" required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <HCaptcha
                ref={captchaRef}
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY!}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken("")}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              type="submit" disabled={isLoading || !captchaToken}
              className="w-full py-2.5 rounded-xl font-semibold text-white power-gradient disabled:opacity-50 mt-2 transition-opacity"
              style={{ boxShadow: "0 4px 20px rgba(217,119,6,0.35)" }}
            >
              {isLoading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    جارٍ التحقق...
                  </span>
                : "دخول"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
