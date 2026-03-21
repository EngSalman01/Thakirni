import { PLAN_LIMITS } from "@/lib/services/subscription.service"

export async function GET() {
  return Response.json({
    plans: [
      {
        tier: "FREE",
        name: "مجاني",
        nameEn: "Free",
        price: { monthly: 0, annual: 0 },
        limits: PLAN_LIMITS.FREE,
        features: ["١٠ خطط يومياً", "٢٥ ذاكرة", "مشروع واحد", "محادثة AI أساسية", "تتبع العادات والأهداف"],
        featuresEn: ["10 plans per day", "25 memories", "1 project", "Basic AI chat", "Habit & goal tracking"],
      },
      {
        tier: "PRO",
        name: "برو",
        nameEn: "Pro",
        price: {
          monthly: { usd: 30, paddlePriceId: process.env.PADDLE_PRICE_PRO_MONTHLY ?? "" },
          annual: { usd: 288, paddlePriceId: process.env.PADDLE_PRICE_PRO_ANNUAL ?? "" },
        },
        limits: PLAN_LIMITS.PRO,
        popular: true,
        features: ["خطط غير محدودة", "ذكريات غير محدودة", "١٠ مشاريع", "ملخص الاجتماعات الصوتية 🎙️", "تحليل الوثائق بالذكاء الاصطناعي", "محادثة AI متقدمة", "تحليلات وتقارير", "٣٠٠ دقيقة تسجيل صوتي شهرياً"],
        featuresEn: ["Unlimited plans", "Unlimited memories", "10 projects", "Meeting voice summary 🎙️", "Document AI analysis", "Advanced AI chat", "Analytics & reports", "300 min voice recording/month"],
      },
      {
        tier: "TEAMS",
        name: "فرق",
        nameEn: "Teams",
        price: {
          monthly: { usd: 60, paddlePriceId: process.env.PADDLE_PRICE_TEAMS_MONTHLY ?? "" },
          annual: { usd: 576, paddlePriceId: process.env.PADDLE_PRICE_TEAMS_ANNUAL ?? "" },
        },
        limits: PLAN_LIMITS.TEAMS,
        features: ["كل مميزات برو", "فرق تعاون غير محدودة", "مشاريع غير محدودة", "لوحة كانبان مشتركة", "ذكريات مشتركة", "تقارير الفريق", "دعم أولوية"],
        featuresEn: ["Everything in Pro", "Unlimited team collaboration", "Unlimited projects", "Shared Kanban boards", "Shared memories", "Team reports", "Priority support"],
      },
    ],
  })
}
