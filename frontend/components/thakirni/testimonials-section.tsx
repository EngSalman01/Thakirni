"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

const TESTIMONIALS = [
  {
    nameAr: "أحمد المنصور",
    nameEn: "Ahmed Al-Mansour",
    roleAr: "مدير مشاريع، شركة ناشئة في الرياض",
    roleEn: "Project Manager, Riyadh Startup",
    textAr: "ذكرني غيّر طريقة عملي بالكامل. كنت أنسى المهام والاجتماعات كثيراً، الآن كل شيء منظم وأتذكر كل شيء.",
    textEn: "Thakirni completely changed how I work. I used to forget tasks and meetings constantly — now everything is organised and I remember everything.",
    rating: 5,
    avatar: "أ",
  },
  {
    nameAr: "سارة الزهراني",
    nameEn: "Sara Al-Zahrani",
    roleAr: "رائدة أعمال، جدة",
    roleEn: "Entrepreneur, Jeddah",
    textAr: "المساعد الذكي على الواتساب خيال! أرسل ملاحظاتي وأفكاري مباشرة ويحفظها لي. أفضل استثمار لأعمالي.",
    textEn: "The WhatsApp AI assistant is incredible! I send my notes and ideas directly and it saves them for me. Best investment for my business.",
    rating: 5,
    avatar: "س",
  },
  {
    nameAr: "خالد العتيبي",
    nameEn: "Khalid Al-Otaibi",
    roleAr: "مدرب إنتاجية، الرياض",
    roleEn: "Productivity Coach, Riyadh",
    textAr: "أنصح جميع عملائي باستخدام ذكرني. الواجهة العربية ممتازة والمميزات قوية جداً مقارنة بالبدائل الأجنبية.",
    textEn: "I recommend Thakirni to all my clients. The Arabic interface is excellent and the features are very powerful compared to foreign alternatives.",
    rating: 5,
    avatar: "خ",
  },
  {
    nameAr: "نورة القحطاني",
    nameEn: "Noura Al-Qahtani",
    roleAr: "طالبة دكتوراه، جامعة الملك سعود",
    roleEn: "PhD Student, King Saud University",
    textAr: "استخدم ذكرني لتتبع أبحاثي وملاحظاتي الدراسية. وفّر عليّ ساعات من التنظيم كل أسبوع.",
    textEn: "I use Thakirni to track my research and study notes. It saves me hours of organisation every week.",
    rating: 5,
    avatar: "ن",
  },
  {
    nameAr: "فيصل الدوسري",
    nameEn: "Faisal Al-Dosari",
    roleAr: "مهندس برمجيات، الدمام",
    roleEn: "Software Engineer, Dammam",
    textAr: "السعر معقول جداً مقارنة بالقيمة الهائلة. أتمنى وجده قبل سنوات. فريق الدعم متجاوب ومحترف.",
    textEn: "The price is very reasonable compared to the enormous value. I wish I'd found it years ago. The support team is responsive and professional.",
    rating: 5,
    avatar: "ف",
  },
  {
    nameAr: "منى الشمري",
    nameEn: "Mona Al-Shammari",
    roleAr: "مديرة تسويق، شركة تقنية",
    roleEn: "Marketing Director, Tech Company",
    textAr: "ميزة تلخيص الاجتماعات وحدها تستحق الاشتراك. الفريق بأكمله صار يستخدمه وما رجعنا للطريقة القديمة.",
    textEn: "The meeting summary feature alone is worth the subscription. The whole team is now using it and we haven't looked back.",
    rating: 5,
    avatar: "م",
  },
]

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

export function TestimonialsSection() {
  const { t, isArabic } = useLanguage()

  return (
    <section className="py-20 overflow-hidden bg-slate-50 dark:bg-[#0d1117]" dir={isArabic ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">
            {t("آراء المستخدمين", "User reviews")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-headline font-bold text-slate-900 dark:text-white mb-3">
            {t("ماذا يقول مستخدمونا", "What our users say")}
          </h2>
          <p className="text-slate-500">
            {t(
              "آلاف المستخدمين في المملكة العربية السعودية يثقون بذكرني",
              "Thousands of users across Saudi Arabia trust Thakirni"
            )}
          </p>
        </motion.div>

        {/* Two-row infinite scroll effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.nameEn}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className="glass-card rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              <StarRow count={t.rating} />
              <p className="text-slate-700 text-sm leading-relaxed flex-1">
                "{isArabic ? t.textAr : t.textEn}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full power-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {isArabic ? t.avatar : t.nameEn[0]}
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">
                    {isArabic ? t.nameAr : t.nameEn}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isArabic ? t.roleAr : t.roleEn}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Aggregate rating */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-slate-500 text-sm"
        >
          <div className="flex items-center gap-2">
            <StarRow count={5} />
            <span className="font-bold text-slate-800">4.9 / 5</span>
          </div>
          <span className="hidden sm:block">·</span>
          <span>{t("بناءً على آلاف التقييمات", "Based on thousands of reviews")}</span>
          <span className="hidden sm:block">·</span>
          <span>🇸🇦 {t("مصنوع للسوق السعودي", "Made for Saudi Arabia")}</span>
        </motion.div>
      </div>
    </section>
  )
}
