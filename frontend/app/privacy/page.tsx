'use client';

import { useLanguage } from '@/components/language-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const EFFECTIVE_DATE = 'March 2026';

export default function PrivacyPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-background" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t('رجوع', 'Back')}
          </Button>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {t('سياسة الخصوصية', 'Privacy Policy')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(`آخر تحديث: ${EFFECTIVE_DATE}`, `Last updated: ${EFFECTIVE_DATE}`)}
          </p>
        </div>

        <Section title={t('١. المقدمة', '1. Introduction')}>
          {t(
            'نحن في تذكرني نقدر خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمع معلوماتك واستخدامها وحمايتها.',
            'At Thakirni, we value your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and protect your information.',
          )}
        </Section>

        <Section title={t('٢. البيانات التي نجمعها', '2. Data We Collect')}>
          {t(
            'نجمع المعلومات التالية: بيانات الحساب (الاسم، البريد الإلكتروني)، المهام والتقويم والذكريات التي تضيفها، بيانات الاستخدام، ومعلومات الجهاز والمتصفح. لا نجمع أرقام بطاقات الائتمان — تتم معالجة المدفوعات بالكامل عبر Paddle.',
            'We collect: account data (name, email), tasks/calendar/memories you add, usage data, and device/browser information. We do not collect credit card numbers — payments are handled entirely by Paddle.',
          )}
        </Section>

        <Section title={t('٣. كيف نستخدم بياناتك', '3. How We Use Your Data')}>
          {t(
            'نستخدم بياناتك لتقديم الخدمة وتحسينها، وإرسال التنبيهات والتذكيرات التي طلبتها، والتواصل معك بشأن حسابك، وتحليل الاستخدام لتحسين التجربة.',
            'We use your data to provide and improve the Service, send notifications and reminders you requested, communicate with you about your account, and analyze usage to improve the experience.',
          )}
        </Section>

        <Section title={t('٤. مشاركة البيانات', '4. Data Sharing')}>
          {t(
            'لا نبيع بياناتك الشخصية لأطراف ثالثة. نشارك البيانات مع: Supabase (تخزين البيانات)، Groq (معالجة الذكاء الاصطناعي لرسائل الدردشة)، Paddle (معالجة المدفوعات)، Vercel (استضافة التطبيق). جميع هؤلاء الشركاء ملزمون بحماية بياناتك.',
            'We do not sell your personal data to third parties. We share data with: Supabase (data storage), Groq (AI processing of chat messages), Paddle (payment processing), and Vercel (application hosting). All partners are bound to protect your data.',
          )}
        </Section>

        <Section title={t('٥. الذكاء الاصطناعي والمحادثات', '5. AI and Conversations')}>
          {t(
            'تُعالَج رسائل الدردشة عبر نماذج Groq AI. يتم استخدام محتوى المحادثات لتقديم الردود فقط ولا يُستخدم لتدريب النماذج أو مشاركته مع أطراف ثالثة خارج نطاق تقديم الخدمة.',
            'Chat messages are processed via Groq AI models. Conversation content is used solely to provide responses and is not used to train models or shared with third parties outside of service delivery.',
          )}
        </Section>

        <Section title={t('٦. أمان البيانات', '6. Data Security')}>
          {t(
            'نستخدم إجراءات أمنية صناعية المعيار لحماية بياناتك، بما في ذلك التشفير أثناء النقل وفي حالة السكون، والتحكم في الوصول، والمراقبة الأمنية المستمرة.',
            'We use industry-standard security measures to protect your data, including encryption in transit and at rest, access controls, and continuous security monitoring.',
          )}
        </Section>

        <Section title={t('٧. ملفات الارتباط (Cookies)', '7. Cookies')}>
          {t(
            'نستخدم ملفات الارتباط الضرورية للمصادقة وإدارة الجلسات فقط. لا نستخدم ملفات الارتباط للتتبع الإعلاني.',
            'We use only essential cookies for authentication and session management. We do not use cookies for advertising tracking.',
          )}
        </Section>

        <Section title={t('٨. حقوقك', '8. Your Rights')}>
          {t(
            'لديك الحق في: الوصول إلى بياناتك الشخصية، وتصحيحها، وحذفها، وتقييد معالجتها، ونقلها. لممارسة هذه الحقوق، تواصل معنا عبر البريد الإلكتروني أدناه.',
            'You have the right to: access, correct, delete, restrict processing of, and port your personal data. To exercise these rights, contact us at the email below.',
          )}
        </Section>

        <Section title={t('٩. الاحتفاظ بالبيانات', '9. Data Retention')}>
          {t(
            'نحتفظ ببياناتك طالما حسابك نشط. عند حذف حسابك، سيتم حذف بياناتك خلال ٣٠ يومًا، باستثناء ما يلزم الاحتفاظ به لأغراض قانونية.',
            'We retain your data for as long as your account is active. Upon account deletion, your data will be deleted within 30 days, except where retention is required for legal purposes.',
          )}
        </Section>

        <Section title={t('١٠. الأطفال', '10. Children')}>
          {t(
            'الخدمة غير موجهة للأشخاص دون سن ١٨ عامًا. لا نجمع عمدًا بيانات من الأطفال.',
            'The Service is not directed to persons under 18 years of age. We do not knowingly collect data from children.',
          )}
        </Section>

        <Section title={t('١١. التغييرات على هذه السياسة', '11. Changes to This Policy')}>
          {t(
            'قد نحدّث هذه السياسة من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل التطبيق.',
            'We may update this policy from time to time. We will notify you of any material changes via email or in-app notification.',
          )}
        </Section>

        <Section title={t('١٢. التواصل معنا', '12. Contact Us')}>
          {t(
            'لأي استفسارات تتعلق بالخصوصية، تواصل معنا على:',
            'For any privacy-related inquiries, contact us at:',
          )}
          {' '}
          <a href="mailto:support@thakirni.com" className="text-primary underline">
            support@thakirni.com
          </a>
        </Section>

        {/* Footer links */}
        <div className="pt-6 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            {t('شروط الاستخدام', 'Terms of Service')}
          </Link>
          <Link href="/refund" className="hover:text-foreground transition-colors">
            {t('سياسة الاسترداد', 'Refund Policy')}
          </Link>
        </div>

      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-muted-foreground leading-relaxed text-sm">{children}</p>
    </section>
  );
}
