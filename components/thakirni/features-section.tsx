"use client";

import { motion, Variants } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrainCircuit, Mic, CalendarClock } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

const features = [
  {
    icon: BrainCircuit,
    titleAr: "مساعد ذكي",
    titleEn: "AI Assistant",
    descriptionAr:
      "مساعدك الذكي يفهم طلباتك ويساعدك في تنظيم ذكرياتك ومهامك تلقائياً.",
    descriptionEn: "Your AI assistant understands your requests and helps organize memories and tasks automatically.",
  },
  {
    icon: Mic,
    titleAr: "تحويل الصوت لنص",
    titleEn: "Voice to Text",
    descriptionAr:
      "حوّل اجتماعاتك وملاحظاتك الصوتية إلى نصوص ومهام منظمة تلقائياً.",
    descriptionEn:
      "Convert meetings and voice notes into structured text & tasks.",
  },
  {
    icon: CalendarClock,
    titleAr: "إدارة الاجتماعات",
    titleEn: "Meeting Management",
    descriptionAr:
      "لخّص اجتماعاتك واستخرج منها المهام والتذكيرات المهمة بذكاء.",
    descriptionEn: "Summarize meetings and extract action items intelligently.",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export function FeaturesSection() {
  const { isArabic, t } = useLanguage();

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
            {t("مميزات فريدة", "Unique Features")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-foreground/60 max-w-2xl mx-auto"
          >
            {t(
              "نقدم لك أدوات مبتكرة لتنظيم يومك وتنشيط ذاكرتك",
              "We offer innovative tools to organize your day and activate your memory",
            )}
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
                    {isArabic ? feature.titleAr : feature.titleEn}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-card-foreground/70 mb-2">
                    {isArabic ? feature.descriptionAr : feature.descriptionEn}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
