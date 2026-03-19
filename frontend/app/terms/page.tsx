'use client';

import { useLanguage } from '@/components/language-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const EFFECTIVE_DATE = 'March 2026';

export default function TermsPage() {
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
            {t('شروط الاستخدام', 'Terms of Service')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(`آخر تحديث: ${EFFECTIVE_DATE}`, `Last updated: ${EFFECTIVE_DATE}`)}
          </p>
        </div>

        <Section title={t('١. القبول والموافقة', '1. Acceptance')}>
          {t(
            'باستخدامك لتطبيق تذكرني (Thakirni) ("الخدمة")، فإنك توافق على الالتزام بهذه الشروط. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام الخدمة.',
            'By using Thakirni (تذكرني) ("the Service"), you agree to be bound by these Terms. If you do not agree, please do not use the Service.',
          )}
        </Section>

        <Section title={t('٢. وصف الخدمة', '2. Description of Service')}>
          {t(
            'تذكرني (Thakirni) هو تطبيق مساعد شخصي ذكي يتيح للمستخدمين إدارة المهام والتقويم والذاكرة الثانية. تتوفر الخدمة بخطط مجانية ومدفوعة. الاسم القانوني للمنتج هو Thakirni.',
            'Thakirni (تذكرني) is an AI-powered personal assistant application that allows users to manage tasks, calendar events, and a second brain memory system. The Service is available on free and paid plans. The legal product name is Thakirni.',
          )}
        </Section>

        <Section title={t('٣. الحسابات', '3. Accounts')}>
          {t(
            'يجب أن يكون عمرك ١٨ عامًا أو أكثر لاستخدام الخدمة. أنت مسؤول عن الحفاظ على سرية بيانات حسابك وعن جميع الأنشطة التي تحدث تحت حسابك.',
            'You must be at least 18 years old to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
          )}
        </Section>

        <Section title={t('٤. الاشتراكات والمدفوعات', '4. Subscriptions and Payments')}>
          {t(
            'تتم معالجة المدفوعات عبر Paddle بصفتهم تاجر التسجيل. تُجدَّد الاشتراكات تلقائيًا ما لم يتم الإلغاء قبل نهاية فترة الاشتراك الحالية. الأسعار محددة بالريال السعودي وتشمل ضريبة القيمة المضافة عند الاقتضاء.',
            'Payments are processed by Paddle as the Merchant of Record. Subscriptions renew automatically unless cancelled before the end of the current billing period. Prices are listed in SAR and include VAT where applicable.',
          )}
        </Section>

        <Section title={t('٥. الاستخدام المقبول', '5. Acceptable Use')}>
          {t(
            'توافق على عدم استخدام الخدمة لأي غرض غير قانوني، أو لنشر محتوى ضار أو مسيء، أو لمحاولة الوصول غير المصرح به إلى أنظمتنا، أو لانتهاك حقوق الآخرين.',
            'You agree not to use the Service for any unlawful purpose, to post harmful or abusive content, to attempt unauthorized access to our systems, or to violate the rights of others.',
          )}
        </Section>

        <Section title={t('٦. الملكية الفكرية', '6. Intellectual Property')}>
          {t(
            'تذكرني وجميع محتوياته وميزاته وأدواته هي ملك لصاحب التطبيق. لا يجوز لك نسخ أي جزء من الخدمة أو تعديله أو توزيعه دون إذن كتابي مسبق.',
            'Thakirni and all its content, features, and functionality are owned by the application developer. You may not copy, modify, or distribute any part of the Service without prior written permission.',
          )}
        </Section>

        <Section title={t('٧. إخلاء المسؤولية', '7. Disclaimer')}>
          {t(
            'تُقدَّم الخدمة "كما هي" دون أي ضمانات صريحة أو ضمنية. لا نضمن أن الخدمة ستكون متاحة دائمًا أو خالية من الأخطاء.',
            'The Service is provided "as is" without any express or implied warranties. We do not guarantee that the Service will always be available or error-free.',
          )}
        </Section>

        <Section title={t('٨. تحديد المسؤولية', '8. Limitation of Liability')}>
          {t(
            'لن نكون مسؤولين بأي حال من الأحوال عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية تنشأ عن استخدامك للخدمة أو عدم قدرتك على استخدامها.',
            'We will not be liable for any indirect, incidental, special, or consequential damages arising from your use or inability to use the Service.',
          )}
        </Section>

        <Section title={t('٩. إنهاء الخدمة', '9. Termination')}>
          {t(
            'نحتفظ بالحق في تعليق حسابك أو إنهائه في أي وقت إذا انتهكت هذه الشروط. يمكنك حذف حسابك في أي وقت من إعدادات الحساب.',
            'We reserve the right to suspend or terminate your account at any time if you violate these Terms. You may delete your account at any time from your account settings.',
          )}
        </Section>

        <Section title={t('١٠. التغييرات على الشروط', '10. Changes to Terms')}>
          {t(
            'نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل التطبيق.',
            'We reserve the right to modify these Terms at any time. You will be notified of any material changes via email or in-app notification.',
          )}
        </Section>

        <Section title={t('١١. القانون الحاكم', '11. Governing Law')}>
          {t(
            'تخضع هذه الشروط لقوانين المملكة العربية السعودية وتُفسَّر وفقًا لها.',
            'These Terms are governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia.',
          )}
        </Section>

        <Section title={t('١٢. التواصل معنا', '12. Contact Us')}>
          {t(
            'إذا كان لديك أي أسئلة حول هذه الشروط، يرجى التواصل معنا عبر البريد الإلكتروني:',
            'If you have any questions about these Terms, please contact us at:',
          )}
          {' '}
          <a href="mailto:support@thakirni.com" className="text-primary underline">
            support@thakirni.com
          </a>
        </Section>

        {/* Footer links */}
        <div className="pt-6 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            {t('سياسة الخصوصية', 'Privacy Policy')}
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