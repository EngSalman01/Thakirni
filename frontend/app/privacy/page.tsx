"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LandingHeader } from "@/components/thakirni/landing-header";
import { LandingFooter } from "@/components/thakirni/landing-footer";
import { useLanguage } from "@/components/language-provider";
import { Shield, Sparkles } from "lucide-react";

const EFFECTIVE_DATE = "March 2026";

const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.2, 1, 0.3, 1] },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section {...FADE_UP} className="space-y-3">
      <h2 className="text-lg font-headline font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground leading-relaxed text-sm font-label">{children}</p>
    </motion.section>
  );
}

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section
        className="relative pt-36 pb-24 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1a2a6c 0%, #2552ca 45%, #ad1d7f 80%, #fd65c2 100%)",
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
            <Shield className="w-4 h-4" />
            {t("حماية بياناتك أولويتنا", "Your data protection is our priority")}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl font-headline font-extrabold text-white mb-4"
          >
            {t("سياسة الخصوصية", "Privacy Policy")}
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

        <Section title={t("١. المقدمة", "1. Introduction")}>
          {t(
            "نحن في ذكرني نقدر خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمع معلوماتك واستخدامها وحمايتها.",
            "At Thakirni, we value your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and protect your information.",
          )}
        </Section>

        <Section title={t("٢. البيانات التي نجمعها", "2. Data We Collect")}>
          {t(
            "نجمع المعلومات التالية: بيانات الحساب (الاسم، البريد الإلكتروني)، المهام والتقويم والذكريات التي تضيفها، بيانات الاستخدام، ومعلومات الجهاز والمتصفح. لا نجمع أرقام بطاقات الائتمان — تتم معالجة المدفوعات بالكامل عبر Paddle.",
            "We collect: account data (name, email), tasks/calendar/memories you add, usage data, and device/browser information. We do not collect credit card numbers — payments are handled entirely by Paddle.",
          )}
        </Section>

        <Section title={t("٣. كيف نستخدم بياناتك", "3. How We Use Your Data")}>
          {t(
            "نستخدم بياناتك لتقديم الخدمة وتحسينها، وإرسال التنبيهات والتذكيرات التي طلبتها، والتواصل معك بشأن حسابك، وتحليل الاستخدام لتحسين التجربة.",
            "We use your data to provide and improve the Service, send notifications and reminders you requested, communicate with you about your account, and analyze usage to improve the experience.",
          )}
        </Section>

        <Section title={t("٤. مشاركة البيانات", "4. Data Sharing")}>
          {t(
            "لا نبيع بياناتك الشخصية لأطراف ثالثة. نشارك البيانات مع: Supabase (تخزين البيانات)، Groq (معالجة الذكاء الاصطناعي لرسائل الدردشة)، Paddle (معالجة المدفوعات)، Vercel (استضافة التطبيق). جميع هؤلاء الشركاء ملزمون بحماية بياناتك.",
            "We do not sell your personal data to third parties. We share data with: Supabase (data storage), Groq (AI processing of chat messages), Paddle (payment processing), and Vercel (application hosting). All partners are bound to protect your data.",
          )}
        </Section>

        <Section title={t("٥. بيانات Google Calendar", "5. Google Calendar Data")}>
          {t(
            "عند ربط حسابك بـ Google Calendar، نطلب الأذونات التالية: قراءة الأحداث (calendar.readonly) وإنشاء/تعديل الأحداث (calendar.events). نستخدم هذه البيانات حصراً لعرض أحداثك داخل تطبيق ذكرني وإنشاء تذكيرات كأحداث في تقويمك. لا نشارك بيانات Google مع أي طرف ثالث، ولا نستخدمها للإعلانات أو لتدريب النماذج أو لأي غرض آخر. يتم تخزين رمز الوصول ورمز التحديث بشكل مشفر في قاعدة بياناتنا. يمكنك إلغاء الربط في أي وقت من إعدادات حسابك. استخدامنا لبيانات Google API يلتزم بـ Google API Services User Data Policy بما في ذلك متطلبات الاستخدام المحدود.",
            "When you connect your Google Calendar, we request the following permissions: read events (calendar.readonly) and create/edit events (calendar.events). We use this data solely to display your events inside Thakirni and to create reminders as calendar events. We do not share Google user data with any third party, and we do not use it for advertising, model training, or any other purpose. Access and refresh tokens are stored encrypted in our database. You can disconnect at any time from your account settings. Our use of Google API data complies with the Google API Services User Data Policy including the Limited Use requirements.",
          )}
        </Section>

        <Section title={t("٦. الذكاء الاصطناعي والمحادثات", "6. AI and Conversations")}>
          {t(
            "تُعالَج رسائل الدردشة عبر نماذج Groq AI. يتم استخدام محتوى المحادثات لتقديم الردود فقط ولا يُستخدم لتدريب النماذج أو مشاركته مع أطراف ثالثة خارج نطاق تقديم الخدمة.",
            "Chat messages are processed via Groq AI models. Conversation content is used solely to provide responses and is not used to train models or shared with third parties outside of service delivery.",
          )}
        </Section>

        <Section title={t("٧. أمان البيانات", "7. Data Security")}>
          {t(
            "نستخدم إجراءات أمنية صناعية المعيار لحماية بياناتك، بما في ذلك التشفير أثناء النقل وفي حالة السكون، والتحكم في الوصول، والمراقبة الأمنية المستمرة.",
            "We use industry-standard security measures to protect your data, including encryption in transit and at rest, access controls, and continuous security monitoring.",
          )}
        </Section>

        <Section title={t("٨. ملفات الارتباط (Cookies)", "8. Cookies")}>
          {t(
            "نستخدم ملفات الارتباط الضرورية للمصادقة وإدارة الجلسات فقط. لا نستخدم ملفات الارتباط للتتبع الإعلاني.",
            "We use only essential cookies for authentication and session management. We do not use cookies for advertising tracking.",
          )}
        </Section>

        <Section title={t("٩. حقوقك", "9. Your Rights")}>
          {t(
            "لديك الحق في: الوصول إلى بياناتك الشخصية، وتصحيحها، وحذفها، وتقييد معالجتها، ونقلها. لممارسة هذه الحقوق، تواصل معنا عبر صفحة التواصل.",
            "You have the right to: access, correct, delete, restrict processing of, and port your personal data. To exercise these rights, contact us via the contact page.",
          )}
        </Section>

        <Section title={t("١٠. الاحتفاظ بالبيانات", "10. Data Retention")}>
          {t(
            "نحتفظ ببياناتك طالما حسابك نشط. عند حذف حسابك، سيتم حذف بياناتك خلال ٣٠ يومًا، باستثناء ما يلزم الاحتفاظ به لأغراض قانونية.",
            "We retain your data for as long as your account is active. Upon account deletion, your data will be deleted within 30 days, except where retention is required for legal purposes.",
          )}
        </Section>

        <Section title={t("١١. الأطفال", "11. Children")}>
          {t(
            "الخدمة غير موجهة للأشخاص دون سن ١٨ عامًا. لا نجمع عمدًا بيانات من الأطفال.",
            "The Service is not directed to persons under 18 years of age. We do not knowingly collect data from children.",
          )}
        </Section>

        <Section title={t("١٢. التغييرات على هذه السياسة", "12. Changes to This Policy")}>
          {t(
            "قد نحدّث هذه السياسة من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل التطبيق.",
            "We may update this policy from time to time. We will notify you of any material changes via email or in-app notification.",
          )}
        </Section>

        <Section title={t("١٣. التواصل معنا", "13. Contact Us")}>
          {t(
            "لأي استفسارات تتعلق بالخصوصية،",
            "For any privacy-related inquiries,",
          )}{" "}
          <Link href="/contact" style={{ color: "#2552ca" }} className="underline underline-offset-4 hover:opacity-80 transition-opacity">
            {t("تواصل معنا من هنا", "contact us here")}
          </Link>
          .
        </Section>

        {/* Footer links */}
        <motion.div
          {...FADE_UP}
          className="pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground font-label"
        >
          <Link href="/terms" className="hover:text-foreground transition-colors">
            {t("شروط الاستخدام", "Terms of Service")}
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
