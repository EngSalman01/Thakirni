"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { LandingHeader } from "@/components/thakirni/landing-header";
import { LandingFooter } from "@/components/thakirni/landing-footer";
import { useLanguage } from "@/components/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, User, CheckCircle2, X as XIcon, Clock } from "lucide-react";

const FADE_UP = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.2, 1, 0.3, 1] as const },
};

export default function ContactPage() {
  const { t } = useLanguage();
  const [name, setName]                   = useState("");
  const [email, setEmail]                 = useState("");
  const [message, setMessage]             = useState("");
  const [hcaptchaToken, setHcaptchaToken] = useState("");
  const [loading, setLoading]             = useState(false);
  const [done, setDone]                   = useState(false);
  const [error, setError]                 = useState("");
  const captchaRef                        = useRef<HCaptcha>(null);

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
        className="relative pt-36 pb-24 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #92400e 0%, #D97706 45%, #F59E0B 80%, #FBBF24 100%)",
        }}
      >
        <motion.div
          className="absolute top-12 right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #FBBF24, transparent 70%)" }}
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-8 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, #92400e, transparent 70%)" }}
          animate={{ y: [0, 16, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        <div className="max-w-3xl mx-auto px-8 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl font-headline font-extrabold text-white mb-4 leading-tight"
          >
            {t("نحب نسمع منك", "We'd love to hear from you")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white/75 text-lg font-label max-w-xl mx-auto"
          >
            {t(
              "سواء عندك سؤال، فكرة، أو ملاحظة — سلمان يرد شخصياً.",
              "Whether you have a question, idea, or feedback — Salman replies personally.",
            )}
          </motion.p>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 items-start">

            {/* ── Left: Info panel ── */}
            <motion.div {...FADE_UP} className="space-y-8">

              {/* Founder card */}
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-md"
                     style={{ border: "2px solid rgba(217,119,6,0.3)" }}>
                  <img src="/founder.jpg" alt="Salman Almnaseer"
                       className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <p className="font-headline font-bold text-foreground text-base leading-tight">
                    Salman Almnaseer
                  </p>
                  <p className="text-muted-foreground text-sm font-label mt-0.5">
                    {t("مطوّر ومؤسس ذكرني", "Developer & Founder of Thakirni")}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-label font-medium">
                      {t("يرد عادةً خلال يوم", "Usually replies within a day")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact methods */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-label">
                  {t("طرق التواصل", "Contact methods")}
                </p>
                {[
                  {
                    icon: Mail,
                    labelAr: "البريد الإلكتروني",
                    labelEn: "Email",
                    valueAr: "salman@thakirni.com",
                    valueEn: "salman@thakirni.com",
                    href: "mailto:salman@thakirni.com",
                  },
                  {
                    icon: XIcon,
                    labelAr: "تويتر",
                    labelEn: "Twitter / X",
                    valueAr: "@Salman_Mn",
                    valueEn: "@Salman_Mn",
                    href: "https://twitter.com/Salman_Mn",
                  },
                ].map(({ icon: Icon, labelAr, labelEn, valueAr, valueEn, href }) => (
                  <a
                    key={labelEn}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                         style={{ background: "rgba(217,119,6,0.1)" }}>
                      <Icon className="w-4 h-4" style={{ color: "#D97706" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-label">{t(labelAr, labelEn)}</p>
                      <p className="text-sm font-semibold text-foreground font-label truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {t(valueAr, valueEn)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Response time note */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground font-label leading-relaxed">
                  {t(
                    "أرد على كل الرسائل بنفسي. توقع رد خلال ٢٤ ساعة في أيام العمل.",
                    "I reply to every message personally. Expect a response within 24 hours on business days.",
                  )}
                </p>
              </div>
            </motion.div>

            {/* ── Right: Form ── */}
            <motion.div {...FADE_UP} transition={{ ...FADE_UP.transition, delay: 0.1 }}>
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center space-y-5 py-16 px-8 rounded-2xl bg-card border border-border"
                  >
                    <div
                      className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                      style={{ background: "rgba(217,119,6,0.1)" }}
                    >
                      <CheckCircle2 className="w-10 h-10" style={{ color: "#D97706" }} />
                    </div>
                    <h2 className="text-2xl font-headline font-bold text-foreground">
                      {t("تم الإرسال! 🎉", "Message sent! 🎉")}
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
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl bg-card border border-border shadow-sm p-8"
                  >
                    <h2 className="text-xl font-headline font-bold text-foreground mb-6">
                      {t("أرسل لي رسالة", "Send me a message")}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">

                      {/* Name */}
                      <div className="space-y-2">
                        <Label className="font-label font-semibold flex items-center gap-2 text-foreground text-sm">
                          <User className="w-3.5 h-3.5" style={{ color: "#D97706" }} />
                          {t("الاسم", "Name")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t("سلمان العمري", "Salman Alomari")}
                          required
                          disabled={loading}
                          className="h-11 rounded-xl font-label"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label className="font-label font-semibold flex items-center gap-2 text-foreground text-sm">
                          <Mail className="w-3.5 h-3.5" style={{ color: "#D97706" }} />
                          {t("البريد الإلكتروني", "Email")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          disabled={loading}
                          dir="ltr"
                          className="h-11 rounded-xl font-label"
                        />
                      </div>

                      {/* Message */}
                      <div className="space-y-2">
                        <Label className="font-label font-semibold flex items-center gap-2 text-foreground text-sm">
                          <MessageSquare className="w-3.5 h-3.5" style={{ color: "#D97706" }} />
                          {t("الرسالة", "Message")} <span className="text-red-500">*</span>
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
                      <div className="flex justify-center pt-1">
                        <HCaptcha
                          ref={captchaRef}
                          sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY!}
                          onVerify={(token) => setHcaptchaToken(token)}
                          onExpire={() => setHcaptchaToken("")}
                        />
                      </div>

                      {/* Error */}
                      <AnimatePresence>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-red-500 font-label bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl"
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      {/* Submit */}
                      <motion.button
                        type="submit"
                        disabled={loading || !hcaptchaToken}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-3.5 rounded-xl text-white font-bold font-label disabled:opacity-50 transition-opacity"
                        style={{
                          background: "linear-gradient(135deg, #D97706 0%, #FBBF24 100%)",
                          boxShadow: "0 4px 20px rgba(217,119,6,0.35)",
                        }}
                      >
                        {loading
                          ? <span className="flex items-center justify-center gap-2">
                              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              {t("جارٍ الإرسال...", "Sending...")}
                            </span>
                          : t("إرسال الرسالة", "Send Message")}
                      </motion.button>

                      <p className="text-center text-xs text-muted-foreground font-label">
                        {t(
                          "بريدك الإلكتروني لن يُشارك مع أي طرف ثالث.",
                          "Your email will never be shared with any third party.",
                        )}
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
