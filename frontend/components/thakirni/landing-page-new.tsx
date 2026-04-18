"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useLanguage } from "@/components/language-provider"

// ── Scroll reveal hook ──────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShow(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, show] as const
}

function Rv({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const [ref, show] = useReveal()
  return (
    <div ref={ref} className={`rv-wrap${show ? " show" : ""}${delay ? ` delay-${delay}` : ""}`} style={style}>
      {children}
    </div>
  )
}

function MaskLine({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ overflow: "hidden", display: "block" }}>
      <div style={{ display: "block", willChange: "transform", animation: `maskUp 1s ${delay}s cubic-bezier(.22,1,.36,1) both`, ...style }}>
        {children}
      </div>
    </div>
  )
}

// ── Icons ───────────────────────────────────────────────────────────────────
const SparkleIcon = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
)
const ArrowLIcon = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)
const ArrowRIcon = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)
const CheckIcon = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const WaIcon = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
)
const MicIcon = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)
const BellIcon = ({ s = 11 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)
const CalIcon = ({ s = 11 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const CreditIcon = ({ s = 11 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)
const SunIcon = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)
const MoonIcon = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

// ── Logo ────────────────────────────────────────────────────────────────────
function Logo({ compact = false, size = 34 }: { compact?: boolean; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: size, height: size, borderRadius: Math.round(size * 0.3), flexShrink: 0,
        background: "linear-gradient(135deg,#FBBF24 0%,#D97706 50%,#92400E 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(size * 0.47), fontWeight: 900, color: "#fff",
        boxShadow: "0 4px 16px rgba(217,119,6,.35)",
        fontFamily: "var(--font-tajawal),sans-serif",
      }}>ذ</div>
      {!compact && (
        <div>
          <div style={{ fontSize: ".92rem", fontWeight: 900, color: "var(--tx)", lineHeight: 1, letterSpacing: "-.01em", fontFamily: "var(--font-tajawal),sans-serif" }}>ذكرني</div>
          <div style={{ fontSize: ".58rem", fontWeight: 700, color: "var(--tx3)", letterSpacing: ".14em", textTransform: "uppercase", fontFamily: "var(--font-inter),sans-serif" }}>Thakirni</div>
        </div>
      )}
    </div>
  )
}

// ── WaPhone ─────────────────────────────────────────────────────────────────
function WaPhone({ isArabic, scale = 1 }: { isArabic: boolean; scale?: number }) {
  const msgs = isArabic ? [
    { out: true,  text: "ذكّرني بكرة الدوام الساعة ٩",         delay: ".7s"  },
    { out: false, text: "تمام 👌 حطيت لك تذكير الساعة 9 بكرة", delay: "1.2s" },
    { out: true,  text: "وضيف اجتماع الخميس الساعة 3 عصر",      delay: "1.7s" },
    { out: false, text: "✅ أُضيف — الخميس 3:00 مساءً",         delay: "2.2s" },
  ] : [
    { out: true,  text: "Remind me tomorrow at 9am",             delay: ".7s"  },
    { out: false, text: "Done! 👌 Set for 9am tomorrow",         delay: "1.2s" },
    { out: true,  text: "Add a meeting Thursday at 3pm",         delay: "1.7s" },
    { out: false, text: "✅ Added — Thursday 3:00 PM",           delay: "2.2s" },
  ]
  const w = Math.round(230 * scale)
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div className="orb" style={{ width: w * 1.6, height: w * 2, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle,rgba(217,119,6,.22),transparent 70%)" }} />
      <div className="phone-frame" style={{ width: w, position: "relative", zIndex: 1 }}>
        <div style={{ background: "#1c1a17", paddingTop: 6, display: "flex", justifyContent: "center" }}>
          <div style={{ width: Math.round(80 * scale), height: Math.round(20 * scale), background: "#0d0b08", borderRadius: "0 0 12px 12px" }} />
        </div>
        <div style={{ background: "#1f2c33", padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 99, background: "var(--grad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff", flexShrink: 0, fontFamily: "var(--font-tajawal),sans-serif" }}>ذ</div>
          <div>
            <div style={{ color: "#e9edef", fontSize: ".76rem", fontWeight: 700 }}>{isArabic ? "ذكرني" : "Thakirni"}</div>
            <div style={{ color: "#8696a0", fontSize: ".6rem", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: 99, background: "#22C55E", display: "inline-block" }} />
              {isArabic ? "متصل" : "Online"}
            </div>
          </div>
        </div>
        <div style={{ background: "#0d1117", padding: "10px 10px 46px", minHeight: Math.round(270 * scale), display: "flex", flexDirection: "column", gap: 7, direction: isArabic ? "rtl" : "ltr" }}>
          {msgs.map((m, i) => (
            <div key={i} style={{
              padding: "7px 10px", fontSize: ".68rem", lineHeight: 1.5,
              maxWidth: "82%", opacity: 0,
              background: m.out ? "#005c4b" : "#202c33", color: "#e9edef",
              alignSelf: m.out ? "flex-end" : "flex-start",
              borderRadius: m.out ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              animation: `chatIn .35s var(--ease) ${m.delay} both`,
              willChange: "transform,opacity",
            }}>
              {m.text}
              <div style={{ fontSize: ".58rem", color: "#8696a0", textAlign: "end", marginTop: 2 }}>9:4{i} {m.out ? "✓✓" : ""}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#1f2c33", padding: "7px 10px", display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ flex: 1, height: 26, background: "#2a3942", borderRadius: 13 }} />
          <div style={{ width: 28, height: 28, borderRadius: 99, background: "#00a884", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><MicIcon s={12} /></div>
        </div>
      </div>
      {[
        { style: { top: 20, insetInlineStart: -22 }, icon: <CheckIcon s={11} />, c: "var(--grn)", text: isArabic ? "تذكير تم ✓" : "Reminder set ✓", d: "1.4s" },
        { style: { top: "40%", insetInlineEnd: -20 }, icon: <CalIcon s={11} />, c: "var(--blu)", text: isArabic ? "اجتماع أُضيف" : "Meeting added", d: "2s" },
        { style: { bottom: 44, insetInlineStart: -18 }, icon: <BellIcon s={11} />, c: "var(--amb)", text: isArabic ? "خطة جديدة" : "New plan", d: "2.5s" },
      ].map((b, i) => (
        <div key={i} style={{
          position: "absolute", ...b.style,
          background: "var(--s1)", border: "1px solid var(--bd-a)", borderRadius: 12,
          padding: "6px 11px", display: "flex", alignItems: "center", gap: 6,
          fontSize: ".68rem", fontWeight: 700, color: "var(--tx)", whiteSpace: "nowrap",
          boxShadow: "var(--shadow-md)", zIndex: 2,
          opacity: 0, animation: `badgeIn .45s var(--ease) ${b.d} both`, willChange: "transform,opacity",
        }}>
          <span style={{ color: b.c }}>{b.icon}</span>{b.text}
        </div>
      ))}
    </div>
  )
}

// ── Landing Nav ─────────────────────────────────────────────────────────────
function LandingNav({ onGoAuth, isArabic, toggleLang, isDark, toggleTheme }: {
  onGoAuth: () => void; isArabic: boolean; toggleLang: () => void; isDark: boolean; toggleTheme: () => void;
}) {
  const t = (a: string, e: string) => isArabic ? a : e
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <div className="nav-pill" style={{
      boxShadow: scrolled
        ? "0 8px 40px rgba(0,0,0,.6), 0 0 0 1px rgba(245,158,11,.08)"
        : "0 4px 20px rgba(0,0,0,.3), 0 0 0 1px rgba(245,158,11,.04)",
    }}>
      <Logo size={30} />
      <div className="nav-links-center" style={{ flex: 1, display: "flex", justifyContent: "center", gap: 2 }}>
        {[t("الميزات", "Features"), t("الأسعار", "Pricing"), t("من نحن", "About")].map(l => (
          <button key={l} className="nav-link">{l}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button className="icon-btn" onClick={toggleTheme} title={isDark ? "وضع النهار" : "وضع الليل"}>
          {isDark ? <SunIcon s={14} /> : <MoonIcon s={14} />}
        </button>
        <button className="icon-btn" onClick={toggleLang} title={isArabic ? "English" : "العربية"}
          style={{ fontSize: ".72rem", fontWeight: 800, fontFamily: isArabic ? "var(--font-inter),sans-serif" : "var(--font-tajawal),sans-serif", letterSpacing: ".02em" }}>
          {isArabic ? "EN" : "ع"}
        </button>
        <div style={{ width: 1, height: 18, background: "var(--bd)", margin: "0 4px" }} />
        <button className="nav-link" onClick={onGoAuth} style={{ fontSize: ".8rem" }}>{t("دخول", "Sign in")}</button>
        <button className="ds-btn ds-btn-primary" onClick={onGoAuth} style={{ padding: "8px 18px", fontSize: ".8rem", borderRadius: 99 }}>
          <SparkleIcon s={12} /> {t("ابدأ مجاناً", "Start free")}
        </button>
      </div>
    </div>
  )
}

// ── Hero ────────────────────────────────────────────────────────────────────
function Hero({ onGoAuth, isArabic }: { onGoAuth: () => void; isArabic: boolean }) {
  const t = (a: string, e: string) => isArabic ? a : e
  return (
    <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 32px 80px", position: "relative", overflow: "hidden", textAlign: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(217,119,6,.14) 0%, transparent 60%)", pointerEvents: "none" }} />
      <div className="hero-dots" />
      <div className="orb" style={{ width: 600, height: 600, top: -100, left: "50%", transform: "translateX(-50%)", background: "radial-gradient(circle, rgba(217,119,6,.15), transparent 70%)" }} />

      <div style={{ overflow: "hidden", marginBottom: 32 }}>
        <div style={{ animation: "maskUp .8s .05s var(--ease) both", willChange: "transform", display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 99, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.16)" }}>
          <SparkleIcon s={13} />
          <span style={{ fontSize: ".68rem", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--amb)" }}>
            {t("مساعدك الذكي · رؤية 2030", "Your AI assistant · Vision 2030")}
          </span>
        </div>
      </div>

      <h1 style={{ margin: "0 auto", maxWidth: 1000, fontFamily: isArabic ? "var(--font-tajawal),sans-serif" : "var(--font-inter),var(--font-syne),sans-serif" }}>
        <MaskLine delay={0.12} style={{ fontSize: "clamp(1.4rem,2.8vw,2.4rem)", fontWeight: 700, color: "var(--tx2)", marginBottom: 4 }}>
          {t("خلّي", "Let")}
        </MaskLine>
        <MaskLine delay={0.28} style={{ fontSize: "clamp(5.5rem,15vw,13rem)", fontWeight: 900, lineHeight: 0.88, background: "var(--grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: isArabic ? "-.01em" : "-.04em", display: "block" }}>
          {t("ذكرني", "Thakirni")}
        </MaskLine>
        <MaskLine delay={0.46} style={{ fontSize: "clamp(2.2rem,5.5vw,5rem)", fontWeight: 900, color: "var(--tx)", lineHeight: 1.1, marginTop: 8, letterSpacing: isArabic ? "-.01em" : "-.03em" }}>
          {t("يهدّي يومك", "calm the noise")}
        </MaskLine>
        <MaskLine delay={0.58} style={{ fontSize: "clamp(2.2rem,5.5vw,5rem)", fontWeight: 900, color: "var(--tx2)", lineHeight: 1.1, letterSpacing: isArabic ? "-.01em" : "-.03em" }}>
          {t("ويرتّب تفاصيله", "& own your day")}
        </MaskLine>
      </h1>

      <div style={{ width: "100%", maxWidth: 480, height: 1, background: "var(--bd)", margin: "32px auto 28px", overflow: "hidden" }}>
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, var(--amb-d), transparent)", transformOrigin: "center", animation: "lineGrow 1.2s .72s var(--ease) both" }} />
      </div>

      <div style={{ overflow: "hidden", maxWidth: 500, margin: "0 auto" }}>
        <p style={{ fontSize: ".98rem", color: "var(--tx2)", lineHeight: 1.85, animation: "maskUp .8s .78s var(--ease) both", willChange: "transform" }}>
          {t("قل اللي بخاطرك… والباقي علينا. يذكّرك، يرتب يومك، ويحفظ كل شيء مهم في فولت خاص — يشتغل على واتساب والويب.",
            "Say what's on your mind — and we handle the rest. Thakirni reminds, organises, and stores what matters across WhatsApp and the web.")}
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp .6s .92s var(--ease) both", willChange: "transform,opacity" }}>
        <button className="ds-btn ds-btn-primary" onClick={onGoAuth} style={{ padding: "15px 32px", fontSize: "1rem", borderRadius: 14 }}>
          {t("ابدأ الحين", "Start Now")} {isArabic ? <ArrowLIcon s={15} /> : <ArrowRIcon s={15} />}
        </button>
        <button className="ds-btn ds-btn-sec" onClick={onGoAuth} style={{ padding: "15px 28px", fontSize: "1rem", borderRadius: 14 }}>
          <WaIcon s={16} /> {t("جرّب واتساب", "Try WhatsApp")}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp .6s 1.05s var(--ease) both" }}>
        {[t("يفهم العربي الطبيعي", "Understands Arabic"), t("فولت خاص وآمن", "Private & Secure"), t("24/7 على واتساب", "24/7 WhatsApp")].map(w => (
          <div key={w} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--s1)", border: "1px solid var(--bd)", borderRadius: 99, fontSize: ".78rem", fontWeight: 600, color: "var(--tx)", boxShadow: "var(--shadow-sm)" }}>
            <span style={{ color: "var(--grn)" }}><CheckIcon s={12} /></span>{w}
          </div>
        ))}
      </div>

      <div className="scroll-hint" style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "var(--tx3)", animation: "fadeIn 1s 1.4s both" }}>
        <div style={{ width: 1, height: 48, background: "linear-gradient(180deg,var(--bd-a),transparent)", borderRadius: 1 }} />
        <span style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase" }}>{t("مرر للأسفل", "Scroll")}</span>
      </div>
    </section>
  )
}

// ── Marquee Strip ───────────────────────────────────────────────────────────
function MarqueeStrip({ isArabic }: { isArabic: boolean }) {
  const items = isArabic
    ? ["واتساب", "ذاكرة ذكية", "رؤية ٢٠٣٠", "ذكاء اصطناعي", "تذكيرات", "خطط يومية", "عادات صحية", "فريق عمل", "تقويم ذكي", "فولت خاص"]
    : ["WhatsApp", "Second Brain", "Vision 2030", "Artificial Intelligence", "Reminders", "Daily Plans", "Healthy Habits", "Team Work", "Smart Calendar", "Private Vault"]
  const repeated = [...items, ...items, ...items, ...items]
  return (
    <div className="mq-outer" style={{ padding: "16px 0", borderTop: "1px solid var(--bd)", borderBottom: "1px solid var(--bd)", background: "var(--s1)" }}>
      <div className="mq-track mq-rtl">
        {repeated.map((item, i) => (
          <span key={i} style={{ padding: "0 28px", fontSize: ".82rem", fontWeight: 700, color: "var(--tx2)", display: "inline-flex", alignItems: "center", gap: 28, whiteSpace: "nowrap" }}>
            {item}
            <span style={{ width: 4, height: 4, borderRadius: 99, background: "var(--amb)", display: "inline-block", flexShrink: 0 }} />
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Showcase ────────────────────────────────────────────────────────────────
function ShowcaseSection({ isArabic }: { isArabic: boolean }) {
  const t = (a: string, e: string) => isArabic ? a : e
  const [ref, show] = useReveal(0.1)
  return (
    <section ref={ref} style={{ padding: "96px 48px", borderTop: "1px solid var(--bd)", position: "relative", overflow: "hidden" }}>
      <div className="orb" style={{ width: 400, height: 400, top: "50%", right: 0, transform: "translateY(-50%)", background: "radial-gradient(circle, rgba(217,119,6,.12), transparent 70%)" }} />
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }} className="hero-two-col">
        <div className={`rv-wrap${show ? " show" : ""}`}>
          <div style={{ fontSize: ".68rem", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--amb)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <SparkleIcon s={11} /> 01
          </div>
          <h2 style={{ fontSize: "clamp(2rem,4vw,3.4rem)", fontWeight: 900, color: "var(--tx)", lineHeight: 1.1, marginBottom: 20, fontFamily: isArabic ? "var(--font-tajawal),sans-serif" : "var(--font-inter),sans-serif" }}>
            {t("عقلك الثاني\nفي جيبك", "Second brain\nin your pocket")}
          </h2>
          <p style={{ fontSize: ".97rem", color: "var(--tx2)", lineHeight: 1.85, maxWidth: 420, marginBottom: 28 }}>
            {t("ذكرني يتذكر كل شيء قلته — مهامك، اجتماعاتك، أفكارك، وذكرياتك. ويرجّعها لك وقت الحاجة بدقة.", "Thakirni remembers everything you say — your tasks, meetings, thoughts, and memories. It brings them back when you need them, precisely.")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "🧠", text: t("ذاكرة دائمة وقابلة للبحث", "Persistent, searchable memory") },
              { icon: "📍", text: t("يستحضر المعلومات في السياق الصح", "Surfaces info in the right context") },
              { icon: "🔒", text: t("مشفّر وخاص لك وحدك", "Encrypted and private to you") },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "var(--s2)", border: "1px solid var(--bd)", borderRadius: 12 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: ".88rem", fontWeight: 600, color: "var(--tx)" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`rv-wrap delay-2${show ? " show" : ""}`} style={{ display: "flex", justifyContent: "center" }}>
          <WaPhone isArabic={isArabic} />
        </div>
      </div>
      <style>{`@media(max-width:768px){.hero-two-col{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

// ── Features ────────────────────────────────────────────────────────────────
function FeaturesSection({ isArabic }: { isArabic: boolean }) {
  const t = (a: string, e: string) => isArabic ? a : e
  const feats = [
    { num: "01", icon: "📱", c: "rgba(34,197,94,.1)",  title: t("واتساب أولاً", "WhatsApp Native"),    desc: t("تحكّم في كل شيء من واتساب. مفيش تطبيق.", "Full control in WhatsApp. No app. No friction.") },
    { num: "02", icon: "🎤", c: "rgba(56,189,248,.1)",  title: t("ملاحظات صوتية", "Voice Notes"),       desc: t("سجّل صوتك وذكرني يحوّله لنص ويحفظه في ثواني.", "Record your voice and Thakirni transcribes it in seconds.") },
    { num: "03", icon: "📅", c: "rgba(167,139,250,.1)", title: t("تقويم ذكي", "Smart Calendar"),       desc: t("يضيف المواعيد بفهم اللغة الطبيعية عربي وإنجليزي.", "Adds appointments by understanding natural language.") },
    { num: "04", icon: "👥", c: "rgba(245,158,11,.1)",  title: t("تعاون الفريق", "Team Collaboration"), desc: t("شاركوا الذاكرة والمشاريع مع الفريق في مساحة واحدة.", "Share memory and tasks with your team in one space.") },
    { num: "05", icon: "🔍", c: "rgba(239,68,68,.08)",  title: t("بحث ذكي", "Smart Search"),           desc: t("ابحث في كل ما حفظته — نصوص، أصوات، ملفات — في ثانية.", "Search everything you saved — notes, audio, files — in seconds.") },
    { num: "06", icon: "🌐", c: "rgba(34,197,94,.08)",  title: t("ثنائي اللغة", "Bilingual"),           desc: t("عربي أصيل وإنجليزي سلس. RTL تلقائي. تصميم مصنوع للمنطقة.", "Authentic Arabic and smooth English. Automatic RTL.") },
  ]
  return (
    <section style={{ borderTop: "1px solid var(--bd)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 48px 32px" }}>
        <Rv>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, flexWrap: "wrap", gap: 24 }}>
            <div>
              <div style={{ fontSize: ".68rem", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--amb)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <SparkleIcon s={11} /> {t("الميزات", "Features")}
              </div>
              <h2 style={{ fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 900, color: "var(--tx)", lineHeight: 1.1, fontFamily: isArabic ? "var(--font-tajawal),sans-serif" : "var(--font-inter),sans-serif" }}>
                {t("كل اللي تحتاجه", "Everything you need")}
              </h2>
            </div>
            <p style={{ fontSize: ".92rem", color: "var(--tx2)", maxWidth: 320, lineHeight: 1.75 }}>
              {t("مش بس تطبيق تذكيرات — ذاكرة ذكية تتعلم معك", "Not just a reminder app — a smart memory that learns with you")}
            </p>
          </div>
        </Rv>
      </div>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 48px 96px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="feat-grid">
        {feats.map((f, i) => (
          <Rv key={i} delay={Math.min((i % 3) + 1, 4) as 0 | 1 | 2 | 3 | 4}>
            <div className="ds-card" style={{ padding: 26, height: "100%", position: "relative", overflow: "hidden" }}>
              <div style={{ fontSize: "4.5rem", fontWeight: 900, opacity: 0.04, color: "var(--tx)", position: "absolute", top: -8, insetInlineEnd: 16, lineHeight: 1, userSelect: "none", fontFamily: "var(--font-inter),sans-serif" }}>{f.num}</div>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: f.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 16, position: "relative" }}>{f.icon}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--tx)", marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: ".84rem", color: "var(--tx2)", lineHeight: 1.75 }}>{f.desc}</p>
            </div>
          </Rv>
        ))}
      </div>
      <style>{`.feat-grid{} @media(max-width:900px){.feat-grid{grid-template-columns:repeat(2,1fr)!important}} @media(max-width:600px){.feat-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

// ── Stats Band ──────────────────────────────────────────────────────────────
function StatsBand({ isArabic }: { isArabic: boolean }) {
  const t = (a: string, e: string) => isArabic ? a : e
  const stats = [
    { val: "24/7", label: t("على واتساب", "On WhatsApp") },
    { val: t("عربي", "Arabic"), label: t("أولاً", "First") },
    { val: "2030", label: t("رؤية المملكة", "KSA Vision") },
    { val: "AI", label: t("مدعوم بالذكاء", "Powered by AI") },
  ]
  return (
    <Rv>
      <div style={{ borderTop: "1px solid var(--bd)", borderBottom: "1px solid var(--bd)", padding: "48px", background: "var(--s1)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, color: "var(--amb)", marginBottom: 6, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: ".8rem", color: "var(--tx2)", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Rv>
  )
}

// ── Pricing ─────────────────────────────────────────────────────────────────
function PricingSection({ onGoAuth, isArabic }: { onGoAuth: () => void; isArabic: boolean }) {
  const t = (a: string, e: string) => isArabic ? a : e
  const plans = [
    { name: t("مجاني", "Free"), price: "0", period: t("شهرياً", "/ mo"), features: [t("50 رسالة شهرياً", "50 messages/mo"), t("ذاكرة أساسية", "Basic memory"), t("تاريخ 7 أيام", "7-day history")], cta: t("ابدأ مجاناً", "Start Free"), featured: false },
    { name: t("الفردي", "Individual"), price: "29", period: t("ر.س/شهر", "SAR/mo"), features: [t("رسائل غير محدودة", "Unlimited messages"), t("ذاكرة كاملة", "Full memory"), t("مزامنة التقويم", "Calendar sync"), t("واتساب 24/7", "WhatsApp 24/7"), t("دعم ذو أولوية", "Priority support")], cta: t("ابدأ الآن", "Get started"), featured: true },
    { name: t("الفريق", "Teams"), price: "79", period: t("ر.س/شهر", "SAR/mo"), features: [t("كل ميزات الفردي", "All Individual"), t("لوحة كانبان مشتركة", "Shared Kanban"), t("ذاكرة الفريق", "Team memory"), t("تحليلات متقدمة", "Advanced analytics")], cta: t("ابدأ مع فريقك", "Start with team"), featured: false },
  ]
  return (
    <section style={{ padding: "96px 48px", borderTop: "1px solid var(--bd)" }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <Rv>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.15)", marginBottom: 14 }}>
              <CreditIcon s={11} /><span style={{ fontSize: ".68rem", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--amb)" }}>{t("الأسعار", "Pricing")}</span>
            </div>
            <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, color: "var(--tx)", marginBottom: 10, fontFamily: isArabic ? "var(--font-tajawal),sans-serif" : "var(--font-inter),sans-serif" }}>
              {t("خطط بسيطة وشفافة", "Simple, transparent pricing")}
            </h2>
            <p style={{ color: "var(--tx2)", fontSize: ".9rem" }}>{t("لا رسوم مخفية · ضريبة القيمة المضافة مشمولة", "No hidden fees · VAT included")}</p>
          </div>
        </Rv>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }} className="price-grid">
          {plans.map((p, i) => (
            <Rv key={i} delay={i + 1 as 1 | 2 | 3}>
              <div className={`ds-card${p.featured ? " price-card-featured" : ""}`} style={{ padding: 28, borderRadius: 22, height: "100%", display: "flex", flexDirection: "column" }}>
                {p.featured && (
                  <div style={{ position: "absolute", top: 16, insetInlineStart: 16, background: "var(--grad)", color: "#fff", fontSize: ".6rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 99 }}>
                    {t("الأكثر طلباً", "Popular")}
                  </div>
                )}
                <div style={{ marginBottom: 18, marginTop: p.featured ? 24 : 0 }}>
                  <div style={{ fontSize: ".83rem", fontWeight: 700, color: "var(--tx2)", marginBottom: 8 }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: "2.8rem", fontWeight: 900, color: p.featured ? "var(--amb)" : "var(--tx)" }}>{p.price}</span>
                    <span style={{ fontSize: ".82rem", color: "var(--tx2)" }}>{p.period}</span>
                  </div>
                </div>
                <div style={{ height: 1, background: "var(--bd)", marginBottom: 18 }} />
                <ul style={{ listStyle: "none", marginBottom: 24, flex: 1 }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", fontSize: ".86rem", color: "var(--tx)" }}>
                      <span style={{ color: "var(--grn)", flexShrink: 0 }}><CheckIcon s={14} /></span>{f}
                    </li>
                  ))}
                </ul>
                <button className={`ds-btn ${p.featured ? "ds-btn-primary" : "ds-btn-sec"}`} onClick={onGoAuth} style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: ".9rem" }}>
                  {p.cta}
                </button>
              </div>
            </Rv>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:768px){.price-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

// ── Big CTA ─────────────────────────────────────────────────────────────────
function BigCTA({ onGoAuth, isArabic }: { onGoAuth: () => void; isArabic: boolean }) {
  const t = (a: string, e: string) => isArabic ? a : e
  return (
    <Rv>
      <section style={{ margin: "0 48px 96px", borderRadius: 28, overflow: "hidden", position: "relative", background: "var(--s1)", border: "1px solid var(--bd-a)", padding: "72px 48px", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(217,119,6,.1), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--grad)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: ".68rem", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--amb)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <SparkleIcon s={11} /> {t("ابدأ اليوم", "Start today")}
          </div>
          <h2 style={{ fontSize: "clamp(2rem,5vw,3.8rem)", fontWeight: 900, color: "var(--tx)", marginBottom: 16, lineHeight: 1.1, fontFamily: isArabic ? "var(--font-tajawal),sans-serif" : "var(--font-inter),sans-serif" }}>
            {t("أنت ما صُمِّمت عشان تتذكر كل شيء", "You weren't built to remember everything")}
          </h2>
          <p style={{ color: "var(--tx2)", marginBottom: 32, fontSize: ".97rem" }}>
            {t("ذكرني صُمِّم عشان ذلك.", "Thakirni was.")}
          </p>
          <button className="ds-btn ds-btn-primary" onClick={onGoAuth} style={{ padding: "16px 40px", fontSize: "1.05rem", borderRadius: 16, boxShadow: "0 8px 40px rgba(217,119,6,.35)" }}>
            {t("ابدأ مجاناً الحين", "Start free now")} {isArabic ? <ArrowLIcon s={16} /> : <ArrowRIcon s={16} />}
          </button>
        </div>
      </section>
    </Rv>
  )
}

// ── Footer ──────────────────────────────────────────────────────────────────
function LandingFooter({ isArabic, toggleLang, isDark, toggleTheme }: { isArabic: boolean; toggleLang: () => void; isDark: boolean; toggleTheme: () => void }) {
  const t = (a: string, e: string) => isArabic ? a : e
  return (
    <footer style={{ borderTop: "1px solid var(--bd)", padding: "56px 48px 32px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }} className="footer-grid">
          <div>
            <Logo />
            <p style={{ marginTop: 14, fontSize: ".84rem", color: "var(--tx2)", lineHeight: 1.8, maxWidth: 260 }}>
              {t("مساعدك الذكي — مصنوع للعرب، يشتغل على واتساب والويب.", "Your AI assistant — made for Arabs, works on WhatsApp and web.")}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="icon-btn" onClick={toggleTheme}>{isDark ? <SunIcon s={14} /> : <MoonIcon s={14} />}</button>
              <button className="icon-btn" onClick={toggleLang} style={{ fontSize: ".72rem", fontWeight: 800 }}>{isArabic ? "EN" : "ع"}</button>
            </div>
          </div>
          {[
            { title: t("المنتج", "Product"), links: [t("الميزات", "Features"), t("الأسعار", "Pricing"), t("الأمان", "Security")] },
            { title: t("الشركة", "Company"), links: [t("من نحن", "About"), t("المدونة", "Blog"), t("تواصل", "Contact")] },
            { title: t("القانوني", "Legal"), links: [t("الشروط", "Terms"), t("الخصوصية", "Privacy"), t("الاسترداد", "Refund")] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: ".67rem", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--amb)", marginBottom: 14 }}>{col.title}</div>
              {col.links.map(l => (
                <div key={l} style={{ fontSize: ".84rem", color: "var(--tx2)", marginBottom: 9, cursor: "pointer", transition: "color .15s ease" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--tx)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--tx2)")}>{l}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--bd)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: ".76rem", color: "var(--tx3)" }}>© 2026 ذكرني · {t("جميع الحقوق محفوظة", "All rights reserved")} · {t("صنع بـ ❤️ في السعودية", "Made with ❤️ in Saudi Arabia")}</div>
          <span style={{ fontSize: ".73rem", color: "var(--tx3)" }}>🇸🇦 Vision 2030 · Year of AI 2026</span>
        </div>
      </div>
      <style>{`@media(max-width:768px){.footer-grid{grid-template-columns:1fr!important}}`}</style>
    </footer>
  )
}

// ── Main Landing Page Component ─────────────────────────────────────────────
export function LandingPageNew() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const isDark = resolvedTheme === "dark"
  const isArabic = language === "ar"

  const onGoAuth = useCallback(() => router.push("/auth"), [router])
  const toggleTheme = useCallback(() => setTheme(isDark ? "light" : "dark"), [isDark, setTheme])
  const toggleLang = useCallback(() => setLanguage(isArabic ? "en" : "ar"), [isArabic, setLanguage])

  if (!mounted) return null

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", direction: isArabic ? "rtl" : "ltr", color: "var(--tx)", fontFamily: isArabic ? "var(--font-tajawal),sans-serif" : "var(--font-inter),sans-serif" }}>
      <LandingNav onGoAuth={onGoAuth} isArabic={isArabic} toggleLang={toggleLang} isDark={isDark} toggleTheme={toggleTheme} />
      <Hero onGoAuth={onGoAuth} isArabic={isArabic} />
      <MarqueeStrip isArabic={isArabic} />
      <ShowcaseSection isArabic={isArabic} />
      <FeaturesSection isArabic={isArabic} />
      <StatsBand isArabic={isArabic} />
      <PricingSection onGoAuth={onGoAuth} isArabic={isArabic} />
      <BigCTA onGoAuth={onGoAuth} isArabic={isArabic} />
      <LandingFooter isArabic={isArabic} toggleLang={toggleLang} isDark={isDark} toggleTheme={toggleTheme} />
    </div>
  )
}
