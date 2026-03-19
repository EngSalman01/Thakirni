"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export function CTASection() {
  const { t } = useLanguage();

  return (
    <section className="py-32 bg-surface-container-highest relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(37,82,202,0.08),transparent_70%)]" />

      <div className="relative container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-6xl font-headline font-extrabold text-on-background mb-6 tracking-tight leading-tight">
            {t(
              "جاهز تبني ذاكرتك الرقمية؟",
              "Ready to build your digital aura?",
            )}
          </h2>
          <p className="text-on-surface-variant mb-10 text-lg md:text-xl leading-relaxed">
            {t(
              "سجّل الآن مجاناً وابدأ بحفظ أول ذكرى. لا نحتاج بطاقة ائتمان.",
              "Sign up for free and start saving your first memory. No credit card required.",
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className="power-gradient text-white font-bold text-xl px-12 py-6 rounded-full shadow-card hover:shadow-ambient transition-all duration-300"
                >
                  {t("ابدأ مجاناً", "Create Free Account")}
                </Button>
              </motion.div>
            </Link>
          </div>

          <p className="text-xs text-on-surface-variant mt-8 italic">
            {t(
              "مجاني للاستخدام الشخصي - لا حاجة لبطاقة ائتمان",
              "Free for personal use - No credit card needed",
            )}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
