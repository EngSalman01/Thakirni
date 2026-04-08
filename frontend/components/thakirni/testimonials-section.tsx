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
    <section className="py-16 sm:py-28 overflow-hidden bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">
            {t("آراء المستخدمين", "User reviews")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-headline font-bold text-foreground mb-3">
            {t("ماذا يقول مستخدمونا", "What our users say")}
          </h2>
          <p className="text-muted-foreground">
            {t(
              "آلاف المستخدمين في المملكة العربية السعودية يثقون بذكرني",
              "Thousands of users across Saudi Arabia trust Thakirni"
            )}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((testimonial, i) => (
            <motion.div
              key={testimonial.nameEn}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.07] rounded-2xl p-6 flex flex-col gap-4 hover:shadow-sm hover:border-amber-100 dark:hover:border-amber-900/30 transition-all duration-200"
            >
              <StarRow count={testimonial.rating} />
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed flex-1">
                "{isArabic ? testimonial.textAr : testimonial.textEn}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full power-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {isArabic ? testimonial.avatar : testimonial.nameEn[0]}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {isArabic ? testimonial.nameAr : testimonial.nameEn}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isArabic ? testimonial.roleAr : testimonial.roleEn}
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
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-muted-foreground text-sm"
        >
          <div className="flex items-center gap-2">
            <StarRow count={5} />
            <span className="font-bold text-foreground">4.9 / 5</span>
          </div>
          <span className="hidden sm:block opacity-40">·</span>
          <span>{t("بناءً على آلاف التقييمات", "Based on thousands of reviews")}</span>
          <span className="hidden sm:block opacity-40">·</span>
          <span>🇸🇦 {t("مصنوع للسوق السعودي", "Made for Saudi Arabia")}</span>
        </motion.div>
      </div>
    </section>
  )
}
