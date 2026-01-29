"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MessageCircle, Bell } from "lucide-react"

const features = [
  {
    icon: Heart,
    titleAr: "صدقة جارية",
    titleEn: "Sadaqah Jariyah",
    descriptionAr: "تكامل مع منصات إحسان وشفاء للتبرع المستمر",
    descriptionEn: "Integration with Ehsan/Shefa platforms",
  },
  {
    icon: MessageCircle,
    titleAr: "رسائل واتساب",
    titleEn: "WhatsApp Messages",
    descriptionAr: "أرسل تذكيرات ورسائل تلقائية عبر واتساب",
    descriptionEn: "Automated reminders via WhatsApp",
  },
  {
    icon: Bell,
    titleAr: "تذكيرات ذكية",
    titleEn: "Smart Reminders",
    descriptionAr: "تذكيرات بالمناسبات والمواعيد المهمة بالذكاء الاصطناعي",
    descriptionEn: "AI-powered event & date reminders",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

export function FeaturesSection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            مميزات فريدة
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-foreground/60 max-w-2xl mx-auto"
          >
            نقدم لك أدوات مبتكرة لحفظ وتخليد ذكرى أحبائك
          </motion.p>
        </div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={cardVariants}>
              <Card className="glass-card h-full hover:shadow-xl hover:shadow-gold/5 transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-gold" />
                  </div>
                  <CardTitle className="text-xl text-card-foreground">
                    {feature.titleAr}
                  </CardTitle>
                  <CardDescription className="font-english text-sm text-card-foreground/60" dir="ltr">
                    {feature.titleEn}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-card-foreground/70 mb-2">{feature.descriptionAr}</p>
                  <p className="font-english text-sm text-card-foreground/50" dir="ltr">
                    {feature.descriptionEn}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
