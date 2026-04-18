"use client";

/**
 * Auth page — atelier redesign (Phase 2).
 *
 * Split layout:
 *   ┌──────────────────┬───────────────────────────┐
 *   │ LEFT  · editorial│ RIGHT · sign-in / sign-up │
 *   │ orbit + wordmark │ hairline inputs + pills   │
 *   └──────────────────┴───────────────────────────┘
 *
 * Preserves every piece of behavior from the previous implementation:
 *   - Email + password sign-in / sign-up through Supabase
 *   - Google OAuth provider
 *   - hCaptcha on both tabs
 *   - Phone country-code picker for sign-up (WhatsApp onboarding)
 *   - Referral code capture (?ref=)
 *   - URL param handling (callback_failed, verify, email_verified, …)
 *   - "Check your email" confirmation screen
 *   - /auth/reset-password link
 *
 * Only the markup is new. All logic is preserved verbatim from the pre-atelier
 * version so auth integration tests keep passing.
 */

import React, { useState, Suspense, useRef } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye, EyeOff, Mail, Lock, User, Phone,
  ArrowLeft, AlertCircle, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Pill,
  WordmarkStacked,
  OrbitSvg,
} from "@/components/thakirni/atelier";

// ── Country dial codes ─────────────────────────────────────────────────────────

const COUNTRY_CODES = [
  // Priority
  { name: "Saudi Arabia",             dial: "966",  flag: "🇸🇦" },
  { name: "UAE",                       dial: "971",  flag: "🇦🇪" },
  { name: "Kuwait",                    dial: "965",  flag: "🇰🇼" },
  { name: "Bahrain",                   dial: "973",  flag: "🇧🇭" },
  { name: "Qatar",                     dial: "974",  flag: "🇶🇦" },
  { name: "Oman",                      dial: "968",  flag: "🇴🇲" },
  { name: "Jordan",                    dial: "962",  flag: "🇯🇴" },
  { name: "Egypt",                     dial: "20",   flag: "🇪🇬" },
  { name: "Malaysia",                  dial: "60",   flag: "🇲🇾" },
  { name: "China",                     dial: "86",   flag: "🇨🇳" },
  // ─────────────────────────────────────────────
  { name: "Afghanistan",               dial: "93",   flag: "🇦🇫" },
  { name: "Albania",                   dial: "355",  flag: "🇦🇱" },
  { name: "Algeria",                   dial: "213",  flag: "🇩🇿" },
  { name: "Andorra",                   dial: "376",  flag: "🇦🇩" },
  { name: "Angola",                    dial: "244",  flag: "🇦🇴" },
  { name: "Argentina",                 dial: "54",   flag: "🇦🇷" },
  { name: "Armenia",                   dial: "374",  flag: "🇦🇲" },
  { name: "Australia",                 dial: "61",   flag: "🇦🇺" },
  { name: "Austria",                   dial: "43",   flag: "🇦🇹" },
  { name: "Azerbaijan",                dial: "994",  flag: "🇦🇿" },
  { name: "Bangladesh",                dial: "880",  flag: "🇧🇩" },
  { name: "Belarus",                   dial: "375",  flag: "🇧🇾" },
  { name: "Belgium",                   dial: "32",   flag: "🇧🇪" },
  { name: "Bolivia",                   dial: "591",  flag: "🇧🇴" },
  { name: "Bosnia & Herzegovina",      dial: "387",  flag: "🇧🇦" },
  { name: "Brazil",                    dial: "55",   flag: "🇧🇷" },
  { name: "Bulgaria",                  dial: "359",  flag: "🇧🇬" },
  { name: "Cambodia",                  dial: "855",  flag: "🇰🇭" },
  { name: "Cameroon",                  dial: "237",  flag: "🇨🇲" },
  { name: "Canada",                    dial: "1",    flag: "🇨🇦" },
  { name: "Chile",                     dial: "56",   flag: "🇨🇱" },
  { name: "Colombia",                  dial: "57",   flag: "🇨🇴" },
  { name: "Congo",                     dial: "242",  flag: "🇨🇬" },
  { name: "Costa Rica",                dial: "506",  flag: "🇨🇷" },
  { name: "Croatia",                   dial: "385",  flag: "🇭🇷" },
  { name: "Cuba",                      dial: "53",   flag: "🇨🇺" },
  { name: "Cyprus",                    dial: "357",  flag: "🇨🇾" },
  { name: "Czech Republic",            dial: "420",  flag: "🇨🇿" },
  { name: "Denmark",                   dial: "45",   flag: "🇩🇰" },
  { name: "Ecuador",                   dial: "593",  flag: "🇪🇨" },
  { name: "El Salvador",               dial: "503",  flag: "🇸🇻" },
  { name: "Estonia",                   dial: "372",  flag: "🇪🇪" },
  { name: "Ethiopia",                  dial: "251",  flag: "🇪🇹" },
  { name: "Finland",                   dial: "358",  flag: "🇫🇮" },
  { name: "France",                    dial: "33",   flag: "🇫🇷" },
  { name: "Georgia",                   dial: "995",  flag: "🇬🇪" },
  { name: "Germany",                   dial: "49",   flag: "🇩🇪" },
  { name: "Ghana",                     dial: "233",  flag: "🇬🇭" },
  { name: "Greece",                    dial: "30",   flag: "🇬🇷" },
  { name: "Guatemala",                 dial: "502",  flag: "🇬🇹" },
  { name: "Honduras",                  dial: "504",  flag: "🇭🇳" },
  { name: "Hong Kong",                 dial: "852",  flag: "🇭🇰" },
  { name: "Hungary",                   dial: "36",   flag: "🇭🇺" },
  { name: "India",                     dial: "91",   flag: "🇮🇳" },
  { name: "Indonesia",                 dial: "62",   flag: "🇮🇩" },
  { name: "Iran",                      dial: "98",   flag: "🇮🇷" },
  { name: "Iraq",                      dial: "964",  flag: "🇮🇶" },
  { name: "Ireland",                   dial: "353",  flag: "🇮🇪" },
  { name: "Israel",                    dial: "972",  flag: "🇮🇱" },
  { name: "Italy",                     dial: "39",   flag: "🇮🇹" },
  { name: "Japan",                     dial: "81",   flag: "🇯🇵" },
  { name: "Kazakhstan",                dial: "7",    flag: "🇰🇿" },
  { name: "Kenya",                     dial: "254",  flag: "🇰🇪" },
  { name: "Kosovo",                    dial: "383",  flag: "🇽🇰" },
  { name: "Kyrgyzstan",                dial: "996",  flag: "🇰🇬" },
  { name: "Laos",                      dial: "856",  flag: "🇱🇦" },
  { name: "Latvia",                    dial: "371",  flag: "🇱🇻" },
  { name: "Lebanon",                   dial: "961",  flag: "🇱🇧" },
  { name: "Libya",                     dial: "218",  flag: "🇱🇾" },
  { name: "Lithuania",                 dial: "370",  flag: "🇱🇹" },
  { name: "Luxembourg",                dial: "352",  flag: "🇱🇺" },
  { name: "Macau",                     dial: "853",  flag: "🇲🇴" },
  { name: "Madagascar",                dial: "261",  flag: "🇲🇬" },
  { name: "Mauritius",                 dial: "230",  flag: "🇲🇺" },
  { name: "Mexico",                    dial: "52",   flag: "🇲🇽" },
  { name: "Moldova",                   dial: "373",  flag: "🇲🇩" },
  { name: "Mongolia",                  flag: "🇲🇳",  dial: "976" },
  { name: "Montenegro",                dial: "382",  flag: "🇲🇪" },
  { name: "Morocco",                   dial: "212",  flag: "🇲🇦" },
  { name: "Mozambique",                dial: "258",  flag: "🇲🇿" },
  { name: "Myanmar",                   dial: "95",   flag: "🇲🇲" },
  { name: "Nepal",                     dial: "977",  flag: "🇳🇵" },
  { name: "Netherlands",               dial: "31",   flag: "🇳🇱" },
  { name: "New Zealand",               dial: "64",   flag: "🇳🇿" },
  { name: "Nicaragua",                 dial: "505",  flag: "🇳🇮" },
  { name: "Nigeria",                   dial: "234",  flag: "🇳🇬" },
  { name: "North Macedonia",           dial: "389",  flag: "🇲🇰" },
  { name: "Norway",                    dial: "47",   flag: "🇳🇴" },
  { name: "Pakistan",                  dial: "92",   flag: "🇵🇰" },
  { name: "Palestine",                 dial: "970",  flag: "🇵🇸" },
  { name: "Panama",                    dial: "507",  flag: "🇵🇦" },
  { name: "Paraguay",                  dial: "595",  flag: "🇵🇾" },
  { name: "Peru",                      dial: "51",   flag: "🇵🇪" },
  { name: "Philippines",               dial: "63",   flag: "🇵🇭" },
  { name: "Poland",                    dial: "48",   flag: "🇵🇱" },
  { name: "Portugal",                  dial: "351",  flag: "🇵🇹" },
  { name: "Romania",                   dial: "40",   flag: "🇷🇴" },
  { name: "Russia",                    dial: "7",    flag: "🇷🇺" },
  { name: "Rwanda",                    dial: "250",  flag: "🇷🇼" },
  { name: "Serbia",                    dial: "381",  flag: "🇷🇸" },
  { name: "Singapore",                 dial: "65",   flag: "🇸🇬" },
  { name: "Slovakia",                  dial: "421",  flag: "🇸🇰" },
  { name: "Slovenia",                  dial: "386",  flag: "🇸🇮" },
  { name: "Somalia",                   dial: "252",  flag: "🇸🇴" },
  { name: "South Africa",              dial: "27",   flag: "🇿🇦" },
  { name: "South Korea",               dial: "82",   flag: "🇰🇷" },
  { name: "Spain",                     dial: "34",   flag: "🇪🇸" },
  { name: "Sri Lanka",                 dial: "94",   flag: "🇱🇰" },
  { name: "Sudan",                     dial: "249",  flag: "🇸🇩" },
  { name: "Sweden",                    dial: "46",   flag: "🇸🇪" },
  { name: "Switzerland",               dial: "41",   flag: "🇨🇭" },
  { name: "Syria",                     dial: "963",  flag: "🇸🇾" },
  { name: "Taiwan",                    dial: "886",  flag: "🇹🇼" },
  { name: "Tajikistan",                dial: "992",  flag: "🇹🇯" },
  { name: "Tanzania",                  dial: "255",  flag: "🇹🇿" },
  { name: "Thailand",                  dial: "66",   flag: "🇹🇭" },
  { name: "Tunisia",                   dial: "216",  flag: "🇹🇳" },
  { name: "Turkey",                    dial: "90",   flag: "🇹🇷" },
  { name: "Turkmenistan",              dial: "993",  flag: "🇹🇲" },
  { name: "Uganda",                    dial: "256",  flag: "🇺🇬" },
  { name: "Ukraine",                   dial: "380",  flag: "🇺🇦" },
  { name: "United Kingdom",            dial: "44",   flag: "🇬🇧" },
  { name: "United States",             dial: "1",    flag: "🇺🇸" },
  { name: "Uruguay",                   dial: "598",  flag: "🇺🇾" },
  { name: "Uzbekistan",                dial: "998",  flag: "🇺🇿" },
  { name: "Venezuela",                 dial: "58",   flag: "🇻🇪" },
  { name: "Vietnam",                   dial: "84",   flag: "🇻🇳" },
  { name: "Yemen",                     dial: "967",  flag: "🇾🇪" },
  { name: "Zimbabwe",                  dial: "263",  flag: "🇿🇼" },
];

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
    0: { labelAr: "قصيرة جداً", labelEn: "Too short", color: "bg-[var(--c-ember)]" },
    1: { labelAr: "ضعيفة",      labelEn: "Weak",       color: "bg-[var(--c-ember)]" },
    2: { labelAr: "متوسطة",     labelEn: "Fair",       color: "bg-[var(--c-brown)]" },
    3: { labelAr: "جيدة",       labelEn: "Good",       color: "bg-[var(--c-sage)]" },
    4: { labelAr: "قوية",       labelEn: "Strong",     color: "bg-[var(--c-sage)]" },
  };
  return { score: clipped, ...map[clipped] };
}

// ── Atelier input — hairline underlined style ─────────────────────────────────

function AtelierField({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="atelier-label flex items-baseline gap-1 text-[var(--atelier-text-subtle)]">
        <span>{label}</span>
        {required && <span className="text-[var(--c-ember)]">*</span>}
      </Label>
      <div
        className={cn(
          "relative border-b transition-colors duration-[var(--atelier-dur-2)]",
          "border-[var(--atelier-border-strong)]",
          "focus-within:border-[var(--c-ember)]",
          error && "border-[var(--c-ember)]",
        )}
      >
        {children}
      </div>
      {hint && !error && (
        <p className="atelier-label text-[var(--atelier-text-subtle)]">{hint}</p>
      )}
      {error && (
        <p className="atelier-label text-[var(--c-ember)]">{error}</p>
      )}
    </div>
  )
}

// ── Auth Form ─────────────────────────────────────────────────────────────────

function AuthForm() {
  const [tab, setTab]                   = useState<"signin" | "signup">("signin");
  const [showSignInPw, setShowSignInPw] = useState(false);
  const [showSignUpPw, setShowSignUpPw] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [signUpDone, setSignUpDone]     = useState(false);
  const [signUpPassword, setSignUpPassword] = useState("");
  const [phoneNumber, setPhoneNumber]   = useState("");
  const [dialCode, setDialCode]         = useState("966");
  const [captchaToken, setCaptchaToken]         = useState("");
  const captchaRef                              = useRef<HCaptcha>(null);
  const [signInCaptchaToken, setSignInCaptchaToken] = useState("");
  const signInCaptchaRef                        = useRef<HCaptcha>(null);

  const { t, isArabic } = useLanguage();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const referralCode = searchParams.get("ref") ?? "";
  const urlError = searchParams.get("error");
  const urlMessage = searchParams.get("message");
  const router  = useRouter();
  const supabase = createClient();
  const strength = getPasswordStrength(signUpPassword);

  // Store pending student plan if user arrived via /auth?plan=student
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("plan") === "student") {
      localStorage.setItem("pendingStudentPlan", "1")
    }
  }, [])

  // Show messages from URL params
  React.useEffect(() => {
    if (urlError === "callback_failed") {
      const reason = searchParams.get("reason");
      setErrors({ form: reason
        ? `Google sign-in failed: ${reason}`
        : t("فشل تسجيل الدخول بجوجل، حاول مرة أخرى", "Google sign-in failed. Please try again.") });
    }
    if (urlError === "confirm_failed") {
      setErrors({ form: t("انتهت صلاحية الرابط أو غير صالح، اطلب رابطاً جديداً", "Link expired or invalid — please request a new one.") });
    }
    if (urlMessage === "verify") {
      setErrors({ form: t("يرجى تأكيد بريدك الإلكتروني أولاً — تحقق من صندوق الوارد", "Please verify your email first — check your inbox.") });
    }
    if (urlMessage === "email_verified") {
      setSuccessMessage(t("تم تأكيد بريدك الإلكتروني! سجّل دخولك الآن.", "Email verified! Sign in to continue."));
    }
    if (urlMessage === "email_changed") {
      setSuccessMessage(t("تم تغيير بريدك الإلكتروني بنجاح. سجّل دخولك بالبريد الجديد.", "Email updated successfully. Sign in with your new email."));
    }
    if (urlMessage === "invite_accepted") {
      setSuccessMessage(t("تم قبول الدعوة! أنشئ كلمة مرورك وسجّل دخولك.", "Invite accepted! Set a password and sign in."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlError, urlMessage]);

  // ── Sign In ──────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    const fd    = new FormData(e.currentTarget);
    const email = (fd.get("email") as string).trim().toLowerCase();
    const pw    = fd.get("password") as string;
    const { error } = await supabase.auth.signInWithPassword({
      email, password: pw,
      options: { captchaToken: signInCaptchaToken || undefined },
    });
    if (error) {
      signInCaptchaRef.current?.resetCaptcha();
      setSignInCaptchaToken("");
      const msg = error.message.includes("Invalid login credentials")
        ? t("البريد أو كلمة المرور غلط، حاول مرة ثانية", "Incorrect email or password.")
        : error.message.includes("Email not confirmed")
        ? t("يرجى تأكيد بريدك الإلكتروني أولاً — تحقق من صندوق الوارد", "Please verify your email first — check your inbox.")
        : error.message;
      setErrors({ form: msg });
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

    // Normalize phone: strip leading zeros/plus then prepend selected dial code
    const rawPhone = phoneNumber.trim().replace(/\s+/g, "").replace(/^\+?0*/, "");
    const normPhone = rawPhone ? `${dialCode}${rawPhone}` : null;

    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: {
        captchaToken: captchaToken || undefined,
        emailRedirectTo: `${location.origin}/auth/confirm`,
        data: {
          full_name: name,
          avatar_url: "",
          phone_number: normPhone,
          preferred_language: isArabic ? "ar" : "en",
        },
      },
    });
    if (error) {
      captchaRef.current?.resetCaptcha();
      setCaptchaToken("");
      setErrors({ form: error.message.includes("already registered")
        ? t("هذا الإيميل مسجل قبل كذا، سجّل دخولك", "This email is already registered. Try signing in.")
        : error.message });
      setIsLoading(false);
      return;
    }

    setSignUpDone(true);
    setIsLoading(false);

    // Send welcome email (fire-and-forget)
    fetch("/api/auth/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    }).catch((e) => console.error("[auth] welcome email error:", e));

    // Apply referral reward if code present (fire-and-forget)
    if (referralCode) {
      fetch("/api/referral/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode }),
      }).catch(() => {})
    }
  };

  // ── Google ───────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setErrors({ form: error.message });
      setIsGoogleLoading(false);
    }
  };

  // ── Email confirm screen ─────────────────────────────────────────
  if (signUpDone) {
    return (
      <div className="w-full max-w-md text-center flex flex-col items-center gap-6 atelier-rise">
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-6 rounded-full"
            style={{
              background: "radial-gradient(closest-side, var(--c-ember-glow), transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[var(--c-ember)]/40 bg-[var(--atelier-bg-elevated)]">
            <CheckCircle2 className="h-10 w-10 text-[var(--c-ember)]" strokeWidth={1.5} />
          </div>
        </div>
        <div className="atelier-eyebrow text-[var(--atelier-text-subtle)]">
          <span className="tabular-nums text-[var(--c-ember)]">01</span>
          <span className="mx-3" aria-hidden>/</span>
          <span>{t("تم الإرسال", "Email sent")}</span>
        </div>
        <h2 className="atelier-h1 atelier-display text-[var(--atelier-text)]">
          {t("تحقق من بريدك", "Check your email")}
        </h2>
        <p className="atelier-lead max-w-sm text-[var(--atelier-text-muted)]">
          {t(
            "أرسلنا لك رابط التأكيد. افتح الرابط لإكمال إنشاء حسابك.",
            "We sent you a confirmation link. Open it to finish creating your account.",
          )}
        </p>
        <Pill
          as="button"
          variant="outline"
          size="lg"
          onClick={() => { setSignUpDone(false); setTab("signin"); }}
        >
          {t("ارجع لتسجيل الدخول", "Back to sign in")}
        </Pill>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md flex flex-col gap-8 atelier-rise">
      {/* Tab switcher — two pill buttons */}
      <div className="atelier-eyebrow flex items-baseline gap-3 text-[var(--atelier-text-subtle)]">
        <span className="tabular-nums text-[var(--c-ember)]">00</span>
        <span aria-hidden>/</span>
        <span>{t("ذكرني · الدخول", "Thakirni · Enter")}</span>
      </div>

      <div className="flex items-center gap-2">
        {(["signin", "signup"] as const).map((t_) => (
          <button
            key={t_}
            type="button"
            onClick={() => { setTab(t_); setErrors({}); }}
            className={cn(
              "flex-1 py-2.5 text-center transition-all duration-[var(--atelier-dur-2)]",
              "border-t atelier-label",
              tab === t_
                ? "border-[var(--c-ember)] text-[var(--c-parchment)]"
                : "border-[var(--atelier-border)] text-[var(--atelier-text-subtle)] hover:text-[var(--c-parchment)] hover:border-[var(--atelier-border-strong)]",
            )}
          >
            {t_ === "signin" ? t("تسجيل الدخول", "Sign In") : t("حساب جديد", "Sign Up")}
          </button>
        ))}
      </div>

      {/* Headline */}
      <div className="flex flex-col gap-3">
        <h2 className={cn(
          "atelier-h1 text-[var(--atelier-text)]",
          isArabic ? "atelier-display-ar" : "atelier-display",
        )}>
          {tab === "signin"
            ? t("أهلاً وسهلاً", "Welcome back")
            : t("ابدأ رحلتك", "Create your account")}
        </h2>
        <p className="atelier-lead text-[var(--atelier-text-muted)]">
          {tab === "signin"
            ? t("سجّل دخولك لفولتك الخاص", "Sign in to your vault")
            : t("أنشئ حسابك وابدأ تحفظ ذكرياتك", "Begin preserving what matters to you")}
        </p>
      </div>

      {/* Google provider — hairline-style pill */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading}
        className={cn(
          "flex items-center justify-center gap-3 py-3.5 px-6 rounded-full",
          "bg-[var(--atelier-bg-elevated)] border border-[var(--atelier-border-strong)]",
          "atelier-body text-[var(--atelier-text)]",
          "hover:border-[var(--c-parchment)] hover:-translate-y-px",
          "transition-all duration-[var(--atelier-dur-2)]",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        {isGoogleLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        <span>{t("متابعة بحساب Google", "Continue with Google")}</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-4">
        <hr className="atelier-rule flex-1" />
        <span className="atelier-eyebrow text-[var(--atelier-text-subtle)]">
          {t("أو بالبريد", "Or with email")}
        </span>
        <hr className="atelier-rule flex-1" />
      </div>

      {/* Success banner */}
      {successMessage && (
        <div
          className="flex items-center gap-3 rounded-[var(--atelier-radius-md)] border p-4 atelier-body"
          style={{
            background: "color-mix(in oklab, var(--c-sage) 12%, transparent)",
            borderColor: "color-mix(in oklab, var(--c-sage) 40%, transparent)",
            color: "var(--c-sage)",
          }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error banner */}
      {errors.form && (
        <div
          className="flex items-center gap-3 rounded-[var(--atelier-radius-md)] border p-4 atelier-body"
          style={{
            background: "var(--c-ember-soft)",
            borderColor: "color-mix(in oklab, var(--c-ember) 40%, transparent)",
            color: "var(--c-ember)",
          }}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* ── SIGN IN ── */}
      {tab === "signin" && (
        <form onSubmit={handleSignIn} className="flex flex-col gap-6">
          <AtelierField label={t("البريد الإلكتروني", "Email")} required>
            <Mail className="pointer-events-none absolute start-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--atelier-text-subtle)]" />
            <Input
              name="email"
              type="email"
              placeholder="example@email.com"
              className="h-11 border-0 bg-transparent ps-7 shadow-none focus-visible:ring-0 placeholder:text-[var(--atelier-text-subtle)] text-[var(--c-parchment)]"
              dir="ltr"
              required
            />
          </AtelierField>

          <AtelierField
            label={
              <span className="flex items-baseline gap-3">
                <span>{t("كلمة المرور", "Password")}</span>
                <Link
                  href="/auth/reset-password"
                  className="text-[var(--c-ember)] hover:text-[var(--c-parchment)] transition-colors !tracking-normal normal-case text-[0.7rem] !font-normal"
                >
                  {t("نسيت كلمة المرور؟", "Forgot?")}
                </Link>
              </span>
            }
            required
          >
            <Lock className="pointer-events-none absolute start-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--atelier-text-subtle)]" />
            <Input
              name="password"
              type={showSignInPw ? "text" : "password"}
              placeholder="••••••••"
              className="h-11 border-0 bg-transparent ps-7 pe-8 shadow-none focus-visible:ring-0 placeholder:text-[var(--atelier-text-subtle)] text-[var(--c-parchment)]"
              dir="ltr"
              required
            />
            <button
              type="button"
              onClick={() => setShowSignInPw(!showSignInPw)}
              aria-label={showSignInPw ? "Hide password" : "Show password"}
              className="absolute end-0 top-1/2 -translate-y-1/2 text-[var(--atelier-text-subtle)] hover:text-[var(--c-parchment)] transition-colors"
            >
              {showSignInPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </AtelierField>

          <div className="flex justify-center py-2">
            <HCaptcha
              ref={signInCaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY!}
              onVerify={(token) => setSignInCaptchaToken(token)}
              onExpire={() => setSignInCaptchaToken("")}
              size="normal"
              theme="dark"
            />
          </div>

          <Pill
            as="button"
            variant="solid"
            size="lg"
            type="submit"
            disabled={isLoading || !signInCaptchaToken}
            trailing={<span aria-hidden>{isArabic ? "←" : "→"}</span>}
            className="w-full"
          >
            {isLoading ? t("جارٍ الدخول...", "Signing in…") : t("دخول", "Sign in")}
          </Pill>
        </form>
      )}

      {/* ── SIGN UP ── */}
      {tab === "signup" && (
        <form onSubmit={handleSignUp} className="flex flex-col gap-6">
          <AtelierField label={t("الاسم الكامل", "Full name")} required>
            <User className="pointer-events-none absolute start-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--atelier-text-subtle)]" />
            <Input
              name="name"
              type="text"
              placeholder={t("محمد العمري", "Salman Almnaseer")}
              className="h-11 border-0 bg-transparent ps-7 shadow-none focus-visible:ring-0 placeholder:text-[var(--atelier-text-subtle)] text-[var(--c-parchment)]"
              required
            />
          </AtelierField>

          <AtelierField label={t("البريد الإلكتروني", "Email")} required>
            <Mail className="pointer-events-none absolute start-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--atelier-text-subtle)]" />
            <Input
              name="email"
              type="email"
              placeholder="example@email.com"
              className="h-11 border-0 bg-transparent ps-7 shadow-none focus-visible:ring-0 placeholder:text-[var(--atelier-text-subtle)] text-[var(--c-parchment)]"
              dir="ltr"
              required
            />
          </AtelierField>

          <AtelierField
            label={
              <span className="flex items-baseline gap-2">
                <span>{t("رقم الجوال", "Phone")}</span>
                <span className="!tracking-normal normal-case text-[0.7rem] text-[var(--atelier-text-subtle)] !font-normal">
                  {t("(اختياري — للواتساب)", "(optional — WhatsApp)")}
                </span>
              </span>
            }
          >
            <div className="flex items-center gap-3 pe-1" dir="ltr">
              <select
                value={dialCode}
                onChange={(e) => setDialCode(e.target.value)}
                className="h-11 cursor-pointer border-0 bg-transparent atelier-body text-[var(--c-parchment)] focus:outline-none focus:ring-0"
                style={{ minWidth: "5.5rem" }}
              >
                {COUNTRY_CODES.map((c, i) => (
                  <option key={`${c.dial}-${i}`} value={c.dial} className="bg-[var(--atelier-bg-elevated)] text-[var(--c-parchment)]">
                    {c.flag} +{c.dial}
                  </option>
                ))}
              </select>
              <div className="relative flex-1">
                <Phone className="pointer-events-none absolute start-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--atelier-text-subtle)]" />
                <Input
                  name="phone"
                  type="tel"
                  placeholder={dialCode === "966" ? "5xxxxxxxx" : "xxxxxxxxx"}
                  className="h-11 border-0 bg-transparent ps-7 w-full shadow-none focus-visible:ring-0 placeholder:text-[var(--atelier-text-subtle)] text-[var(--c-parchment)]"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
          </AtelierField>

          <AtelierField
            label={t("كلمة المرور", "Password")}
            required
            hint={signUpPassword.length === 0
              ? t("٨ أحرف على الأقل، يفضّل مع أرقام ورموز", "At least 8 characters — letters, numbers & symbols for a stronger password.")
              : undefined
            }
            error={errors.password}
          >
            <Lock className="pointer-events-none absolute start-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--atelier-text-subtle)]" />
            <Input
              name="password"
              type={showSignUpPw ? "text" : "password"}
              placeholder="••••••••"
              className="h-11 border-0 bg-transparent ps-7 pe-8 shadow-none focus-visible:ring-0 placeholder:text-[var(--atelier-text-subtle)] text-[var(--c-parchment)]"
              dir="ltr"
              required
              minLength={8}
              onChange={(e) => setSignUpPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowSignUpPw(!showSignUpPw)}
              aria-label={showSignUpPw ? "Hide password" : "Show password"}
              className="absolute end-0 top-1/2 -translate-y-1/2 text-[var(--atelier-text-subtle)] hover:text-[var(--c-parchment)] transition-colors"
            >
              {showSignUpPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </AtelierField>

          {signUpPassword.length > 0 && (
            <div className="-mt-3 flex flex-col gap-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-[2px] flex-1 transition-colors",
                      i <= strength.score ? strength.color : "bg-[var(--atelier-border)]",
                    )}
                  />
                ))}
              </div>
              <p className="atelier-label text-[var(--atelier-text-subtle)]">
                {isArabic ? strength.labelAr : strength.labelEn}
              </p>
            </div>
          )}

          <AtelierField
            label={t("تأكيد كلمة المرور", "Confirm password")}
            required
            error={errors.confirmPassword}
          >
            <Lock className="pointer-events-none absolute start-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--atelier-text-subtle)]" />
            <Input
              name="confirmPassword"
              type={showSignUpPw ? "text" : "password"}
              placeholder="••••••••"
              className="h-11 border-0 bg-transparent ps-7 shadow-none focus-visible:ring-0 placeholder:text-[var(--atelier-text-subtle)] text-[var(--c-parchment)]"
              dir="ltr"
              required
            />
          </AtelierField>

          <div className="flex justify-center py-2">
            <HCaptcha
              ref={captchaRef}
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY!}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken("")}
              size="normal"
              theme="dark"
            />
          </div>

          <Pill
            as="button"
            variant="solid"
            size="lg"
            type="submit"
            disabled={isLoading || !captchaToken}
            trailing={<span aria-hidden>{isArabic ? "←" : "→"}</span>}
            className="w-full"
          >
            {isLoading ? t("جارٍ التسجيل...", "Creating account…") : t("إنشاء حساب", "Create account")}
          </Pill>
        </form>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const { t, isArabic } = useLanguage();

  return (
    <div
      className={cn("atelier-root min-h-screen flex")}
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* ── Left · editorial panel ─────────────────────────────────── */}
      <aside className="hidden lg:flex lg:w-[48%] relative overflow-hidden border-e border-[var(--atelier-border)]">
        {/* Ember radial */}
        <div
          aria-hidden
          className="atelier-glow-pulse pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 35%, rgba(255,81,19,0.18), transparent 65%)",
          }}
        />
        {/* Orbit */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <OrbitSvg preset="active" size={780} />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full w-full p-14">
          {/* Top row: brand + eyebrow */}
          <div className="flex flex-col gap-8">
            <div className="atelier-eyebrow text-[var(--atelier-text-subtle)]">
              <span className="tabular-nums text-[var(--c-ember)]">ذ</span>
              <span aria-hidden className="mx-3">/</span>
              <span>{t("ذكرني · الدخول", "Thakirni · Auth")}</span>
            </div>
            <WordmarkStacked
              size="xl"
              orientation="stacked"
              primary={isArabic ? "arabic" : "latin"}
              withCaption
            />
          </div>

          {/* Bottom row: editorial sell */}
          <div className="flex flex-col gap-8 max-w-lg">
            <h2 className={cn(
              "atelier-h1 text-[var(--c-parchment)]",
              isArabic ? "atelier-display-ar" : "atelier-display",
            )}>
              {t(
                "ذاكرتك الثانية.",
                "Your second brain.",
              )}
              <span className="block atelier-italic text-[var(--c-parchment-2)]">
                {t("ملكك للأبد.", "Yours forever.")}
              </span>
            </h2>

            <ul className="flex flex-col gap-4 border-t border-[var(--atelier-border)] pt-8">
              {[
                { ar: "ذاكرة ثانية تحفظ كل شيء",  en: "A second brain that remembers everything" },
                { ar: "تشفير كامل وخصوصية تامة",   en: "Full encryption, complete privacy" },
                { ar: "يفهم العربي السعودي",       en: "Speaks your language — in your dialect" },
                { ar: "بيانات مستضافة في السعودية", en: "Data hosted in Saudi Arabia" },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="mt-2 inline-block h-[2px] w-5 shrink-0 bg-[var(--c-ember)]"
                  />
                  <span className="atelier-body text-[var(--atelier-text-muted)]">
                    {t(item.ar, item.en)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="atelier-label text-[var(--atelier-text-subtle)] pt-4 border-t border-[var(--atelier-border)]">
              {t(
                "مبني لرؤية المملكة 2030 · عام الذكاء الاصطناعي 2026",
                "Built for Vision 2030 · Year of AI 2026",
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right · form panel ─────────────────────────────────────── */}
      <main className="w-full lg:w-[52%] flex flex-col relative isolate">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 md:px-10 py-6 border-b border-[var(--atelier-border)]">
          <Link
            href="/"
            className="atelier-label inline-flex items-center gap-2 text-[var(--atelier-text-muted)] hover:text-[var(--c-parchment)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
            <span>{t("الرئيسية", "Home")}</span>
          </Link>
          {/* Mobile wordmark */}
          <div className="lg:hidden">
            <WordmarkStacked size="sm" orientation="inline" primary={isArabic ? "arabic" : "latin"} />
          </div>
          <span className="atelier-eyebrow text-[var(--atelier-text-subtle)]">
            {t("مرحباً بك", "Welcome")}
          </span>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-10 py-12">
          <Suspense
            fallback={
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--c-ember)] border-t-transparent" />
            }
          >
            <AuthForm />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="px-6 md:px-10 py-6 border-t border-[var(--atelier-border)]">
          <p className="atelier-label text-[var(--atelier-text-subtle)] text-center">
            {t("بالاستمرار أنت توافق على", "By continuing you agree to our")}{" "}
            <Link href="/privacy" className="text-[var(--c-ember)] hover:text-[var(--c-parchment)] transition-colors">
              {t("سياسة الخصوصية", "Privacy Policy")}
            </Link>
            {" · "}
            <Link href="/terms" className="text-[var(--c-ember)] hover:text-[var(--c-parchment)] transition-colors">
              {t("الشروط", "Terms")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
