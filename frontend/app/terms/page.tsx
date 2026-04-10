"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LandingHeader } from "@/components/thakirni/landing-header";
import { LandingFooter } from "@/components/thakirni/landing-footer";
import { useLanguage } from "@/components/language-provider";
import { FileText } from "lucide-react";

const EFFECTIVE_DATE = "March 2026";

const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.2, 1, 0.3, 1] as const },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section {...FADE_UP} className="space-y-3">
      <h2 className="text-lg font-headline font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground leading-relaxed text-sm font-label">{children}</p>
    </motion.section>
  );
}

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section
        className="relative pt-36 pb-24 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #92400e 0%, #D97706 45%, #F59E0B 80%, #FBBF24 100%)",
        }}
      >
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-40 blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #fff, transparent 70%)" }}
        />
        <div className="max-w-3xl mx-auto px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white/80 text-sm font-label mb-8"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <FileText className="w-4 h-4" />
            {t("اقرأها بهدوء", "Please read carefully")}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl font-headline font-extrabold text-white mb-4"
          >
            {t("شروط الاستخدام", "Terms of Service")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 font-label text-sm"
          >
            {t(`آخر تحديث: ${EFFECTIVE_DATE}`, `Last updated: ${EFFECTIVE_DATE}`)}
          </motion.p>
        </div>
      </section>

      {/* ── Content ──────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-8 py-16 space-y-10">

        <Section title={t("١. القبول والموافقة", "1. Acceptance")}>
          {t(
            "باستخدامك لتطبيق ذكرني (Thakirni) («الخدمة»)، فإنك توافق على الالتزام بهذه الشروط. إذا ما كنت توافق على هذه الشروط، لا تستخدم الخدمة.",
            'By using Thakirni (ذكرني) ("the Service"), you agree to be bound by these Terms. If you do not agree, please do not use the Service.',
          )}
        </Section>

        <Section title={t("٢. وصف الخدمة", "2. Description of Service")}>
          {t(
            "ذكرني (Thakirni) هو تطبيق مساعد شخصي ذكي يتيح للمستخدمين إدارة المهام والتقويم والذاكرة الثانية. تتوفر الخدمة بخطط مجانية ومدفوعة. الاسم القانوني للمنتج هو Thakirni.",
            "Thakirni (ذكرني) is an AI-powered personal assistant application that allows users to manage tasks, calendar events, and a second brain memory system. The Service is available on free and paid plans. The legal product name is Thakirni.",
          )}
        </Section>

        <Section title={t("٣. الحسابات", "3. Accounts")}>
          {t(
            "يجب أن يكون عمرك ١٨ عامًا أو أكثر لاستخدام الخدمة. أنت مسؤول عن الحفاظ على سرية بيانات حسابك وعن جميع الأنشطة التي تحدث تحت حسابك.",
            "You must be at least 18 years old to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
          )}
        </Section>

        <Section title={t("٤. الاشتراكات والمدفوعات", "4. Subscriptions and Payments")}>
          {t(
            "تتم معالجة المدفوعات عبر Paddle بصفتهم تاجر التسجيل. تُجدَّد الاشتراكات تلقائيًا ما لم يتم الإلغاء قبل نهاية فترة الاشتراك الحالية. الأسعار محددة بالريال السعودي وتشمل ضريبة القيمة المضافة عند الاقتضاء.",
            "Payments are processed by Paddle as the Merchant of Record. Subscriptions renew automatically unless cancelled before the end of the current billing period. Prices are listed in SAR and include VAT where applicable.",
          )}
        </Section>

        <Section title={t("٥. الاستخدام المقبول", "5. Acceptable Use")}>
          {t(
            "توافق على عدم استخدام الخدمة لأي غرض غير قانوني، أو لنشر محتوى ضار أو مسيء، أو لمحاولة الوصول غير المصرح به إلى أنظمتنا، أو لانتهاك حقوق الآخرين.",
            "You agree not to use the Service for any unlawful purpose, to post harmful or abusive content, to attempt unauthorized access to our systems, or to violate the rights of others.",
          )}
        </Section>

        <Section title={t("٦. الملكية الفكرية", "6. Intellectual Property")}>
          {t(
            "ذكرني وجميع محتوياته وميزاته وأدواته هي ملك لـ سلمان المناصير. لا يجوز لك نسخ أي جزء من الخدمة أو تعديله أو توزيعه دون إذن كتابي مسبق.",
            "Thakirni and all its content, features, and functionality are owned by Salman Almnaseer. You may not copy, modify, or distribute any part of the Service without prior written permission.",
          )}
        </Section>

        <Section title={t("٧. إخلاء المسؤولية", "7. Disclaimer")}>
          {t(
            "تُقدَّم الخدمة «كما هي» دون أي ضمانات صريحة أو ضمنية. لا نضمن أن الخدمة ستكون متاحة دائمًا أو خالية من الأخطاء.",
            'The Service is provided "as is" without any express or implied warranties. We do not guarantee that the Service will always be available or error-free.',
          )}
        </Section>

        <Section title={t("٨. تحديد المسؤولية", "8. Limitation of Liability")}>
          {t(
            "لن نكون مسؤولين بأي حال من الأحوال عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية تنشأ عن استخدامك للخدمة أو عدم قدرتك على استخدامها.",
            "We will not be liable for any indirect, incidental, special, or consequential damages arising from your use or inability to use the Service.",
          )}
        </Section>

        <Section title={t("٩. إنهاء الخدمة", "9. Termination")}>
          {t(
            "نحتفظ بالحق في تعليق حسابك أو إنهائه في أي وقت إذا انتهكت هذه الشروط. تقدر تحذف حسابك في أي وقت من إعدادات الحساب.",
            "We reserve the right to suspend or terminate your account at any time if you violate these Terms. You may delete your account at any time from your account settings.",
          )}
        </Section>

        <Section title={t("١٠. التغييرات على الشروط", "10. Changes to Terms")}>
          {t(
            "نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل التطبيق.",
            "We reserve the right to modify these Terms at any time. You will be notified of any material changes via email or in-app notification.",
          )}
        </Section>

        <Section title={t("١١. القانون الحاكم", "11. Governing Law")}>
          {t(
            "تخضع هذه الشروط لقوانين المملكة العربية السعودية وتُفسَّر وفقًا لها.",
            "These Terms are governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia.",
          )}
        </Section>

        <Section title={t("١٢. التواصل معنا", "12. Contact Us")}>
          {t(
            "إذا عندك أي أسئلة حول هذه الشروط،",
            "If you have any questions about these Terms,",
          )}{" "}
          <Link href="/contact" style={{ color: "#D97706" }} className="underline underline-offset-4 hover:opacity-80 transition-opacity">
            {t("تواصل معنا من هنا", "contact us here")}
          </Link>
          .
        </Section>

        {/* Footer links */}
        <motion.div
          {...FADE_UP}
          className="pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground font-label"
        >
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            {t("سياسة الخصوصية", "Privacy Policy")}
          </Link>
          <Link href="/refund" className="hover:text-foreground transition-colors">
            {t("سياسة الاسترداد", "Refund Policy")}
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            {t("تواصل معنا", "Contact")}
          </Link>
        </motion.div>
      </main>

      <LandingFooter />
    </div>
  );
}
