"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import {
  TrendingUp, Copy, Check, ExternalLink, DollarSign,
  Users, Loader2, ChevronRight, BarChart3,
} from "lucide-react"
import { toast } from "sonner"

interface Affiliate {
  id: string
  code: string
  commission_rate: number
  status: string
  total_referred: number
  total_revenue: number
  total_paid: number
  pending_payout: number
  payout_email: string | null
}

interface Conversion {
  id: string
  plan_purchased: string | null
  revenue: number
  commission: number
  status: string
  created_at: string
}

export function AffiliateCard() {
  const { t } = useLanguage()
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [link, setLink] = useState("")
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [payoutEmail, setPayoutEmail] = useState("")

  useEffect(() => {
    fetch("/api/affiliate")
      .then(r => r.json())
      .then(d => {
        setAffiliate(d.affiliate)
        setConversions(d.conversions ?? [])
        setLink(d.link ?? "")
      })
      .finally(() => setLoading(false))
  }, [])

  async function joinAffiliate() {
    setJoining(true)
    try {
      const res = await fetch("/api/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payout_email: payoutEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAffiliate(data.affiliate)
      setLink(data.link)
      toast.success(t("تم تفعيل برنامج الشراكة!", "Affiliate program activated!"))
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("حدث خطأ", "Something went wrong"))
    } finally {
      setJoining(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(t("تم نسخ الرابط!", "Link copied!"))
  }

  if (loading) {
    return (
      <div className="bg-[#f6f3f2] rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#2552ca]" />
      </div>
    )
  }

  // Not enrolled yet
  if (!affiliate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#f6f3f2] rounded-2xl p-8 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2552ca]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#2552ca]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{t("برنامج الشركاء", "Affiliate Program")}</h3>
            <p className="text-sm text-slate-500">{t("اكسب ٢٠٪ من كل اشتراك", "Earn 20% on every subscription")}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { num: "20%", label: t("عمولة", "Commission") },
            { num: "∞",   label: t("لا حد للأرباح", "No earning cap") },
            { num: "30d", label: t("مدة ملفات الارتباط", "Cookie duration") },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl p-3">
              <div className="text-xl font-bold gradient-text">{item.num}</div>
              <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          {t(
            "شارك رابطك الخاص مع أصدقائك وزملائك. ستحصل على ٢٠٪ من كل اشتراك مدفوع مدى الحياة.",
            "Share your unique link with friends and colleagues. You'll earn 20% of every paid subscription, recurring."
          )}
        </p>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">
            {t("بريد استلام المدفوعات (اختياري)", "Payout email (optional)")}
          </label>
          <input
            type="email"
            value={payoutEmail}
            onChange={e => setPayoutEmail(e.target.value)}
            placeholder="paypal@example.com"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#2552ca]/30"
          />
        </div>

        <button
          onClick={joinAffiliate}
          disabled={joining}
          className="w-full py-3 rounded-xl text-white font-semibold power-gradient btn-glow hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          {t("انضم لبرنامج الشركاء", "Join Affiliate Program")}
        </button>
      </motion.div>
    )
  }

  // Enrolled — show dashboard
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#f6f3f2] rounded-2xl p-8 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2552ca]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#2552ca]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{t("برنامج الشركاء", "Affiliate Program")}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              {t("نشط", "Active")} · {affiliate.commission_rate}% {t("عمولة", "commission")}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users,    val: affiliate.total_referred, label: t("إجمالي المحالين", "Total referred") },
          { icon: DollarSign, val: `$${affiliate.total_revenue.toFixed(0)}`, label: t("إجمالي الإيرادات", "Revenue generated") },
          { icon: BarChart3, val: `$${affiliate.pending_payout.toFixed(2)}`, label: t("في انتظار الدفع", "Pending payout") },
          { icon: DollarSign, val: `$${affiliate.total_paid.toFixed(0)}`, label: t("إجمالي المدفوع", "Total paid out") },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl p-4 text-center">
              <Icon className="w-4 h-4 text-[#2552ca] mx-auto mb-1.5" />
              <div className="font-bold text-slate-800">{String(stat.val)}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Link */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">
          {t("رابط الإحالة الخاص بك", "Your affiliate link")}
        </label>
        <div className="flex gap-2">
          <input
            readOnly
            value={link}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-mono"
          />
          <button
            onClick={copyLink}
            className="px-4 py-2.5 rounded-xl bg-[#2552ca] text-white hover:opacity-90 transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <a
            href={link} target="_blank" rel="noopener noreferrer"
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <p className="text-xs text-slate-400">
          {t("كودك:", "Your code:")} <span className="font-mono font-semibold text-slate-600">{affiliate.code}</span>
        </p>
      </div>

      {/* Recent conversions */}
      {conversions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700">{t("التحويلات الأخيرة", "Recent conversions")}</h4>
          <div className="space-y-1.5">
            {conversions.slice(0, 5).map(conv => (
              <div key={conv.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5">
                <div>
                  <span className="text-sm font-medium text-slate-700">{conv.plan_purchased ?? "Subscription"}</span>
                  <span className="text-xs text-slate-400 ms-2">{new Date(conv.created_at).toLocaleDateString()}</span>
                </div>
                <div className="text-end">
                  <div className="text-sm font-bold text-green-600">+${conv.commission.toFixed(2)}</div>
                  <div className={`text-xs ${conv.status === "confirmed" ? "text-green-500" : "text-amber-500"}`}>
                    {conv.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
