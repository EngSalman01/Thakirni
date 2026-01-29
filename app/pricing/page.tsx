"use client"

import { motion } from "framer-motion"
import { Check, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LandingHeader } from "@/components/thakirni/landing-header"
import { LandingFooter } from "@/components/thakirni/landing-footer"
import { cn } from "@/lib/utils"

const pricingTiers = [
  {
    name: "مجاني",
    nameEn: "Free",
    price: "٠",
    priceEn: "0",
    period: "ر.س / شهرياً",
    periodEn: "SAR / month",
    description: "للبدء في حفظ ذكرياتك الأولى",
    descriptionEn: "Start preserving your first memories",
    features: [
      { text: "٥ خطط / تذكيرات", textEn: "5 plans / reminders", included: true },
      { text: "المساعد الذكي محدود", textEn: "Limited AI assistant", included: true },
      { text: "تذكيرات بريد إلكتروني", textEn: "Email reminders", included: true },
      { text: "تذكيرات SMS", textEn: "SMS reminders", included: false },
      { text: "تذكيرات واتساب", textEn: "WhatsApp reminders", included: false },
      { text: "شجرة العائلة", textEn: "Family tree", included: false },
      { text: "روابط الصدقة", textEn: "Charity links", included: false },
      { text: "QR للشواهد", textEn: "QR gravestones", included: false },
    ],
    cta: "ابدأ مجاناً",
    ctaEn: "Start Free",
    popular: false,
  },
  {
    name: "المميز",
    nameEn: "Premium",
    price: "٤٩",
    priceEn: "49",
    period: "ر.س / شهرياً",
    periodEn: "SAR / month",
    description: "للعائلات التي تريد حفظ ذكرياتها",
    descriptionEn: "For families who want to preserve memories",
    features: [
      { text: "خطط غير محدودة", textEn: "Unlimited plans", included: true },
      { text: "المساعد الذكي الكامل", textEn: "Full AI assistant", included: true },
      { text: "تذكيرات بريد إلكتروني", textEn: "Email reminders", included: true },
      { text: "تذكيرات SMS", textEn: "SMS reminders", included: true },
      { text: "تذكيرات واتساب", textEn: "WhatsApp reminders", included: true },
      { text: "شجرة العائلة (١٠ أفراد)", textEn: "Family tree (10 members)", included: true },
      { text: "روابط الصدقة", textEn: "Charity links", included: true },
      { text: "QR للشواهد (٢)", textEn: "QR gravestones (2)", included: true },
    ],
    cta: "اشترك الآن",
    ctaEn: "Subscribe Now",
    popular: true,
  },
  {
    name: "العائلي",
    nameEn: "Family",
    price: "٩٩",
    priceEn: "99",
    period: "ر.س / شهرياً",
    periodEn: "SAR / month",
    description: "للعائلات الكبيرة مع ميزات متقدمة",
    descriptionEn: "For large families with advanced features",
    features: [
      { text: "كل ميزات المميز", textEn: "All Premium features", included: true },
      { text: "أفراد عائلة غير محدودين", textEn: "Unlimited family members", included: true },
      { text: "كبسولات الزمن", textEn: "Time capsules", included: true },
      { text: "تكامل إحسان/شفاء", textEn: "Ehsan/Shefa integration", included: true },
      { text: "QR للشواهد (١٠)", textEn: "QR gravestones (10)", included: true },
      { text: "تقارير وإحصائيات", textEn: "Reports & analytics", included: true },
      { text: "دعم أولوية", textEn: "Priority support", included: true },
      { text: "تخصيص كامل", textEn: "Full customization", included: true },
    ],
    cta: "اشترك الآن",
    ctaEn: "Subscribe Now",
    popular: false,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <LandingHeader />
      
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              خطط تناسب الجميع
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
              اختر الخطة المناسبة لك ولعائلتك
            </p>
            <p className="font-english text-sm text-muted-foreground/70" dir="ltr">
              Choose the plan that fits you and your family
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            {pricingTiers.map((tier, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className={cn(
                  "relative h-full flex flex-col transition-all duration-300",
                  tier.popular 
                    ? "border-primary shadow-xl shadow-primary/10 scale-105" 
                    : "border-border hover:border-primary/50 hover:shadow-lg"
                )}>
                  {tier.popular && (
                    <div className="absolute -top-4 inset-x-0 flex justify-center">
                      <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        الأكثر شعبية
                      </div>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold text-foreground">
                      {tier.name}
                    </CardTitle>
                    <CardDescription className="font-english text-sm" dir="ltr">
                      {tier.nameEn}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                      <span className="text-muted-foreground text-sm me-1">{tier.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className={cn(
                              "text-sm",
                              feature.included ? "text-foreground" : "text-muted-foreground/60"
                            )}>
                              {feature.text}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button 
                      className={cn(
                        "w-full",
                        tier.popular 
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                          : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      )}
                      size="lg"
                    >
                      {tier.cta}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* FAQ Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-16"
          >
            <p className="text-muted-foreground mb-4">
              هل لديك أسئلة؟ تواصل معنا أو اقرأ{" "}
              <a href="#faq" className="text-primary hover:underline">
                الأسئلة الشائعة
              </a>
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span>إلغاء في أي وقت</span>
              <span>{"•"}</span>
              <span>دعم على مدار الساعة</span>
              <span>{"•"}</span>
              <span>ضمان استرداد ٣٠ يوم</span>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </main>
  )
}
