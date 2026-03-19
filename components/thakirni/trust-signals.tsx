"use client";

import { motion } from "framer-motion";
import { Shield, Users, Clock, Brain, Bell, Globe } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

const stats = [
  { valueAr: "+500", valueEn: "500+", labelAr: "مستخدم نشط", labelEn: "Active Users", icon: Users },
  { valueAr: "+10,000", valueEn: "10,000+", labelAr: "ذكرى محفوظة", labelEn: "Memories Saved", icon: Brain },
  { valueAr: "٩٩.٩٪", valueEn: "99.9%", labelAr: "وقت التشغيل", labelEn: "Uptime", icon: Clock },
  { valueAr: "AES-256", valueEn: "AES-256", labelAr: "تشفير متقدم", labelEn: "Encryption", icon: Shield },
];

const capabilities = [
  {
    icon: Bell,
    titleAr: "تذكيرات ذكية",
    titleEn: "Smart Reminders",
    descAr: "تذكيرات تلقائية لمهامك واجتماعاتك حتى لا تنسى أي شيء مهم",
    descEn: "Automatic reminders for your tasks and meetings so you never miss anything important",
  },
  {
    icon: Brain,
    titleAr: "ذكاء اصطناعي",
    titleEn: "AI-Powered",
    descAr: "مساعد ذكي يفهم لغتك ويساعدك في تنظيم يومك",
    descEn: "Smart assistant that understands your language and helps organize your day",
  },
  {
    icon: Globe,
    titleAr: "عربي وإنجليزي",
    titleEn: "Arabic & English",
    descAr: "مصمم للمستخدم العربي مع دعم كامل للإنجليزية",
    descEn: "Designed for Arabic users with full English support",
  },
];

export function TrustSignals() {
  const { t, isArabic } = useLanguage();

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-surface-container-low/30">
      <div className="container mx-auto px-4">

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16 md:mb-24"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center p-4 md:p-6 rounded-xl bg-surface-container-lowest shadow-ambient hover-lift"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <p className="text-2xl md:text-3xl font-headline font-bold text-on-surface mb-1">
                {isArabic ? stat.valueAr : stat.valueEn}
              </p>
              <p className="text-sm text-on-surface-variant">
                {t(stat.labelAr, stat.labelEn)}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Why Thakirni */}
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-headline font-bold text-on-background mb-4 tracking-tight"
          >
            {t("لماذا ذكرني؟", "Why Thakirni?")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-on-surface-variant max-w-2xl mx-auto text-lg"
          >
            {t(
              "صُممت خصيصاً للمستخدم العربي لتكون الذاكرة الثانية التي لا تنسى",
              "Built specifically for Arabic users to be the second memory that never forgets",
            )}
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {capabilities.map((cap, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="p-6 md:p-8 rounded-xl bg-surface-container-lowest shadow-ambient hover-lift group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <cap.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-headline font-bold text-on-surface mb-2">
                {t(cap.titleAr, cap.titleEn)}
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {t(cap.descAr, cap.descEn)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
