"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export function CTASection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 islamic-pattern opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="relative container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            {t(
              "جاهز تبدأ تنظم حياتك؟",
              "Ready to start organizing your life?",
            )}
          </h2>
          <p className="text-muted-foreground mb-8 text-base md:text-lg leading-relaxed">
            {t(
              "سجّل الآن مجاناً وابدأ بحفظ أول ذكرى. لا نحتاج بطاقة ائتمان.",
              "Sign up for free and start saving your first memory. No credit card required.",
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 gap-2"
              >
                {t("ابدأ مجاناً", "Start Free")}
                <ArrowLeft className="w-5 h-5 rtl:rotate-0 ltr:rotate-180" />
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
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
