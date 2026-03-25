"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { LandingHeader } from "@/components/thakirni/landing-header";
import { LandingFooter } from "@/components/thakirni/landing-footer";
import { useLanguage } from "@/components/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, User, CheckCircle2, Sparkles } from "lucide-react";

const FADE_UP = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, ease: [0.2, 1, 0.3, 1] },
};

export default function ContactPage() {
  const { t } = useLanguage();
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [message, setMessage]         = useState("");
  const [hcaptchaToken, setHcaptchaToken] = useState("");
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState("");
  const captchaRef                    = useRef<HCaptcha>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, hcaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      captchaRef.current?.resetCaptcha();
      setHcaptchaToken("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="relative pt-36 pb-28 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1a2a6c 0%, #2552ca 45%, #ad1d7f 80%, #fd65c2 100%)",
        }}
      >
        <motion.div
          className="absolute top-12 right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #fd65c2, transparent 70%)" }}
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="max-w-3xl mx-auto px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white/80 text-sm font-label mb-8"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <Sparkles className="w-4 h-4" />
            {t("تواصل معنا", "Get in Touch")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl font-headline font-extrabold text-white mb-5 leading-tight"
          >
            {t("نحب نسمع منك", "We'd love to hear from you")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white/75 text-xl font-label max-w-xl mx-auto"
          >
            {t(
              "سواء عندك سؤال، فكرة، أو ملاحظة — سلمان يرد شخصياً.",
              "Whether you have a question, idea, or feedback — Salman replies personally.",
            )}
          </motion.p>
        </div>
      </section>

      {/* ── Form ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-2xl mx-auto px-8">
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-5 py-16"
            >
              <div
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #2552ca22, #fd65c222)" }}
              >
                <CheckCircle2 className="w-10 h-10" style={{ color: "#2552ca" }} />
              </div>
              <h2 className="text-2xl font-headline font-bold text-foreground">
                {t("تم الإرسال!", "Message sent!")}
              </h2>
              <p className="text-muted-foreground font-label">
                {t(
                  "وصلتنا رسالتك. سلمان راح يرد عليك قريباً.",
                  "Your message was received. Salman will reply shortly.",
                )}
              </p>
              <button
                onClick={() => { setDone(false); setName(""); setEmail(""); setMessage(""); }}
                className="text-sm font-label underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("إرسال رسالة ثانية", "Send another message")}
              </button>
            </motion.div>
          ) : (
            <motion.div {...FADE_UP}>
              <div
                className="rounded-3xl p-8 md:p-10 shadow-xl"
                style={{
                  background: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(37,82,202,0.1)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="dark:hidden" />
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Name */}
                  <div className="space-y-2">
                    <Label className="font-label font-semibold flex items-center gap-2 text-foreground">
                      <User className="w-4 h-4" style={{ color: "#2552ca" }} />
                      {t("الاسم", "Name")}
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("سلمان العمري", "Salman Alomari")}
                      required
                      disabled={loading}
                      className="h-12 rounded-xl font-label"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="font-label font-semibold flex items-center gap-2 text-foreground">
                      <Mail className="w-4 h-4" style={{ color: "#2552ca" }} />
                      {t("البريد الإلكتروني", "Email")}
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      disabled={loading}
                      dir="ltr"
                      className="h-12 rounded-xl font-label"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label className="font-label font-semibold flex items-center gap-2 text-foreground">
                      <MessageSquare className="w-4 h-4" style={{ color: "#2552ca" }} />
                      {t("الرسالة", "Message")}
                    </Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t("اكتب رسالتك هنا...", "Write your message here...")}
                      required
                      disabled={loading}
                      rows={5}
                      className="rounded-xl resize-none font-label"
                    />
                  </div>

                  {/* hCaptcha */}
                  <div className="flex justify-center">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY!}
                      onVerify={(token) => setHcaptchaToken(token)}
                      onExpire={() => setHcaptchaToken("")}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-red-500 font-label bg-red-50 px-4 py-3 rounded-xl">
                      {error}
                    </p>
                  )}

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading || !hcaptchaToken}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 rounded-xl text-white font-bold font-label disabled:opacity-60 transition-opacity"
                    style={{
                      background: "linear-gradient(135deg, #2552ca 0%, #fd65c2 100%)",
                      boxShadow: "0 4px 20px rgba(37,82,202,0.35)",
                    }}
                  >
                    {loading
                      ? t("جارٍ الإرسال...", "Sending...")
                      : t("إرسال الرسالة", "Send Message")}
                  </motion.button>
                </form>
              </div>

              {/* Reassurance note */}
              <p className="text-center text-sm text-muted-foreground font-label mt-6">
                {t(
                  "بريدك الإلكتروني لن يُشارك مع أي طرف ثالث.",
                  "Your email will never be shared with any third party.",
                )}
              </p>
            </motion.div>
          )}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
