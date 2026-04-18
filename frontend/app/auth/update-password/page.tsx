"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import {
  OrbitSvg,
  Pill,
  WordmarkStacked,
} from "@/components/thakirni/atelier"

/* -----------------------------------------------------------------
   /auth/update-password — atelier rewrite
   Signed-in users change their password from settings or an invite
   flow. Identical behaviour to reset-password but richer sell.
----------------------------------------------------------------- */

function AtelierField({
  label,
  hint,
  children,
  required,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label className="block">
      <span
        className="atelier-eyebrow block mb-2"
        style={{ color: "var(--atelier-text-subtle)" }}
      >
        {label}
        {required ? (
          <span style={{ color: "var(--c-ember)" }} className="ms-1">
            *
          </span>
        ) : null}
      </span>
      {children}
      {hint ? (
        <span
          className="mt-2 block text-xs"
          style={{
            color: "var(--atelier-text-subtle)",
            fontFamily: "var(--atelier-font-body)",
          }}
        >
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export default function UpdatePasswordPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  const inputCx =
    "w-full bg-transparent border-0 border-b pb-2.5 pt-1 text-base outline-none transition-colors focus:border-[var(--c-ember)]"
  const inputStyle: React.CSSProperties = {
    borderBottomColor: "var(--atelier-border-strong)",
    color: "var(--atelier-text)",
    fontFamily: "var(--atelier-font-body)",
    letterSpacing: "0.01em",
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError(
        t(
          "كلمة المرور لازم تكون ٨ أحرف على الأقل",
          "Password must be at least 8 characters.",
        ),
      )
      return
    }

    if (password !== confirmPassword) {
      setError(
        t("كلمات المرور ما تطابقت، حاول مرة ثانية", "Passwords do not match."),
      )
      return
    }

    setIsLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
      setIsLoading(false)
      return
    }

    setDone(true)
    setIsLoading(false)

    setTimeout(() => {
      router.push("/vault")
    }, 2000)
  }

  return (
    <div className="atelier-root min-h-screen flex flex-col lg:flex-row">
      {/* ── Left aside ───────────────────────────────────────────── */}
      <aside className="relative hidden lg:flex lg:w-[48%] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <OrbitSvg preset="active" size={780} />
        </div>
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--c-ember) 16%, transparent) 0%, transparent 70%)",
            animation: "atelier-glow-pulse 8s ease-in-out infinite",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between h-full w-full p-14">
          <div className="flex items-center gap-3">
            <span
              className="atelier-eyebrow"
              style={{ color: "var(--atelier-text-subtle)" }}
            >
              02 / Keys
            </span>
          </div>

          <div>
            <WordmarkStacked size="xl" primary="latin" withCaption />
            <h2
              className="atelier-display mt-10"
              style={{
                color: "var(--atelier-text)",
                fontSize: "clamp(2.25rem, 4vw, 3.25rem)",
                lineHeight: 1.05,
              }}
            >
              {t("كلمة", "Set a")} <br />
              <em
                className="atelier-italic"
                style={{ color: "var(--c-ember)" }}
              >
                {t("جديدة", "new")}
              </em>{" "}
              <br />
              {t("للخزنة", "password")}
            </h2>
            <p
              className="atelier-lead max-w-md mt-6"
              style={{ color: "var(--atelier-text-muted)" }}
            >
              {t(
                "خزنتك لا تكشف نفسها لأحد. المفتاح الجديد يبقى بين يديك.",
                "Your vault reveals itself to no one. The new key stays with you.",
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span
              className="atelier-eyebrow"
              style={{ color: "var(--atelier-text-subtle)" }}
            >
              Vision 2030 · Year of AI 2026
            </span>
            <span
              style={{
                fontFamily: "var(--atelier-font-body)",
                color: "var(--atelier-text-subtle)",
                fontSize: 13,
              }}
            >
              {t(
                "تشفير من طرف إلى طرف · المملكة العربية السعودية",
                "End-to-end encrypted · Kingdom of Saudi Arabia",
              )}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Right main ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col atelier-root">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 lg:px-10 py-6"
          style={{ borderBottom: "1px solid var(--atelier-border)" }}
        >
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 text-sm transition-colors"
            style={{
              color: "var(--atelier-text-muted)",
              fontFamily: "var(--atelier-font-body)",
            }}
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t("تسجيل الدخول", "Sign in")}
          </Link>
          <span
            className="atelier-eyebrow"
            style={{ color: "var(--atelier-text-subtle)" }}
          >
            Thakirni · ذكرني
          </span>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 text-center">
              <WordmarkStacked size="md" primary="latin" />
            </div>

            {done ? (
              <div className="text-center space-y-6 flex flex-col items-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    border: "1.5px solid var(--c-ember)",
                    background:
                      "color-mix(in oklab, var(--c-ember) 8%, transparent)",
                  }}
                >
                  <CheckCircle2
                    className="w-9 h-9"
                    style={{ color: "var(--c-ember)" }}
                  />
                </div>
                <div>
                  <span
                    className="atelier-eyebrow block mb-3"
                    style={{ color: "var(--atelier-text-subtle)" }}
                  >
                    03 / Done
                  </span>
                  <h1 className="atelier-h1" style={{ color: "var(--atelier-text)" }}>
                    {t("تم تحديث كلمة المرور", "Password updated")}
                  </h1>
                  <p
                    className="mt-3"
                    style={{
                      fontFamily: "var(--atelier-font-body)",
                      color: "var(--atelier-text-muted)",
                    }}
                  >
                    {t(
                      "كلمة مرورك الجديدة جاهزة. جارٍ تحويلك للخزنة...",
                      "Your new password is set. Taking you to the vault...",
                    )}
                  </p>
                </div>
                <div
                  className="w-5 h-5 rounded-full animate-spin"
                  style={{
                    border: "2px solid var(--c-ember)",
                    borderTopColor: "transparent",
                  }}
                />
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <span
                    className="atelier-eyebrow block mb-3"
                    style={{ color: "var(--atelier-text-subtle)" }}
                  >
                    01 / Change key
                  </span>
                  <h1
                    className="atelier-h1"
                    style={{ color: "var(--atelier-text)" }}
                  >
                    {t("تعيين كلمة ", "Set a new ")}
                    <em
                      className="atelier-italic"
                      style={{ color: "var(--c-ember)" }}
                    >
                      {t("مرور جديدة", "password")}
                    </em>
                  </h1>
                  <p
                    className="mt-4"
                    style={{
                      fontFamily: "var(--atelier-font-body)",
                      color: "var(--atelier-text-muted)",
                    }}
                  >
                    {t(
                      "اختر كلمة مرور قوية لحماية حسابك.",
                      "Choose a strong password to secure your account.",
                    )}
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mb-6 p-4 rounded-none flex items-start gap-3 text-sm"
                    style={{
                      background: "var(--c-ember-soft)",
                      borderLeft: "2px solid var(--c-ember)",
                      color: "var(--atelier-text)",
                      fontFamily: "var(--atelier-font-body)",
                    }}
                  >
                    <AlertCircle
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: "var(--c-ember)" }}
                    />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-7">
                  <AtelierField
                    label={t("كلمة المرور الجديدة", "New password")}
                    hint={t("على الأقل ٨ أحرف", "At least 8 characters")}
                    required
                  >
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={inputCx}
                        style={inputStyle}
                        dir="ltr"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute end-0 top-1/2 -translate-y-1/2 p-1 transition-colors"
                        style={{ color: "var(--atelier-text-subtle)" }}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </AtelierField>

                  <AtelierField
                    label={t("تأكيد كلمة المرور", "Confirm password")}
                    required
                  >
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        className={inputCx}
                        style={inputStyle}
                        dir="ltr"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        aria-label={
                          showConfirm
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        className="absolute end-0 top-1/2 -translate-y-1/2 p-1 transition-colors"
                        style={{ color: "var(--atelier-text-subtle)" }}
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </AtelierField>

                  <div className="pt-2">
                    <Pill
                      as="button"
                      type="submit"
                      variant="solid"
                      size="lg"
                      disabled={isLoading}
                      trailing={
                        !isLoading ? (
                          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                        ) : null
                      }
                      className="w-full justify-center"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full animate-spin"
                            style={{
                              border: "2px solid currentColor",
                              borderTopColor: "transparent",
                            }}
                          />
                          {t("جارٍ الحفظ...", "Saving...")}
                        </span>
                      ) : (
                        t("حفظ كلمة المرور", "Save password")
                      )}
                    </Pill>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 lg:px-10 py-6 flex items-center justify-between text-xs"
          style={{
            borderTop: "1px solid var(--atelier-border)",
            color: "var(--atelier-text-subtle)",
            fontFamily: "var(--atelier-font-body)",
          }}
        >
          <span>
            © {new Date().getFullYear()} Thakirni · {t("الرياض", "Riyadh")}
          </span>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-[var(--atelier-text-muted)] transition-colors"
            >
              {t("الخصوصية", "Privacy")}
            </Link>
            <Link
              href="/terms"
              className="hover:text-[var(--atelier-text-muted)] transition-colors"
            >
              {t("الشروط", "Terms")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
