'use client';

import { useLanguage } from '@/components/language-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const EFFECTIVE_DATE = 'March 2026';

export default function RefundPage() {
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
            {t('سياسة الاسترداد', 'Refund Policy')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(`آخر تحديث: ${EFFECTIVE_DATE}`, `Last updated: ${EFFECTIVE_DATE}`)}
          </p>
        </div>

        <Section title={t('١. نظرة عامة', '1. Overview')}>
          {t(
            'نسعى جاهدين لضمان رضاك التام عن تذكرني. إذا لم تكن راضيًا عن الخدمة، يمكنك طلب استرداد وفق الشروط الموضحة في هذه السياسة.',
            'We strive to ensure your complete satisfaction with Thakirni. If you are not satisfied with the Service, you may request a refund under the conditions outlined in this policy.',
          )}
        </Section>

        <Section title={t('٢. ضمان استرداد الأموال خلال ١٤ يومًا', '2. 14-Day Money-Back Guarantee')}>
          {t(
            'نقدم ضمان استرداد كامل للأموال خلال ١٤ يومًا من تاريخ أي دفعة. إذا لم تكن راضيًا لأي سبب خلال هذه الفترة، تواصل معنا وسنرد لك المبلغ بالكامل دون أسئلة.',
            'We offer a full money-back guarantee within 14 days of any payment. If you are unsatisfied for any reason within this period, contact us and we will issue a full refund, no questions asked.',
          )}
        </Section>

        <Section title={t('٣. الاشتراكات المتجددة', '3. Recurring Subscriptions')}>
          {t(
            'تسري سياسة الاسترداد لمدة ١٤ يومًا على جميع الدفعات بما فيها الاشتراكات المتجددة. يمكنك طلب استرداد أي دفعة خلال ١٤ يومًا من تاريخها.',
            'The 14-day refund policy applies to all payments including recurring subscription charges. You may request a refund for any payment within 14 days of that payment date.',
          )}
        </Section>

        <Section title={t('٤. الإلغاء', '4. Cancellation')}>
          {t(
            'يمكنك إلغاء اشتراكك في أي وقت من إعدادات حسابك. عند الإلغاء، ستتمكن من الاستمرار في استخدام الخدمة حتى نهاية فترة الفوترة الحالية. لن تُفرض عليك رسوم بعد ذلك.',
            'You may cancel your subscription at any time from your account settings. Upon cancellation, you will retain access to the Service until the end of your current billing period. You will not be charged after that.',
          )}
        </Section>

        <Section title={t('٥. الاشتراكات غير المستخدمة', '5. Unused Subscriptions')}>
          {t(
            'لا نقدم استردادًا جزئيًا عن الأيام غير المستخدمة من فترة الاشتراك الحالية عند الإلغاء.',
            'We do not offer partial refunds for unused days remaining in a current billing period upon cancellation.',
          )}
        </Section>

        <Section title={t('٦. كيف تعمل سياسة الاسترداد', '6. How Our Refund Policy Works')}>
          {t(
            'تنطبق سياسة الاسترداد لمدة ١٤ يومًا على جميع الدفعات دون استثناء. لا توجد شروط أو قيود إضافية — إذا طلبت استردادًا خلال ١٤ يومًا، ستحصل عليه.',
            'The 14-day refund policy applies to all payments without exception. There are no additional conditions or restrictions — if you request a refund within 14 days, you will receive it.',
          )}
        </Section>

        <Section title={t('٧. كيفية طلب الاسترداد', '7. How to Request a Refund')}>
          {t(
            'لطلب الاسترداد، يرجى مراسلتنا عبر البريد الإلكتروني مع ذكر: عنوان البريد الإلكتروني المرتبط بحسابك، وتاريخ الدفعة، وسبب طلب الاسترداد. سنرد على طلبك خلال ٣ أيام عمل.',
            'To request a refund, please email us with: the email address associated with your account, the payment date, and the reason for your refund request. We will respond within 3 business days.',
          )}
          {' '}
          <a href="mailto:support@thakirni.com" className="text-primary underline">
            support@thakirni.com
          </a>
        </Section>

        <Section title={t('٨. معالجة الاسترداد', '8. Refund Processing')}>
          {t(
            'تتم معالجة المدفوعات عبر Paddle بصفتهم تاجر التسجيل. سيتم رد المبلغ إلى طريقة الدفع الأصلية خلال ٥-١٠ أيام عمل بعد الموافقة على طلب الاسترداد.',
            'Payments are processed by Paddle as the Merchant of Record. Refunds will be returned to the original payment method within 5-10 business days after your refund request is approved.',
          )}
        </Section>

        <Section title={t('٩. التغييرات على هذه السياسة', '9. Changes to This Policy')}>
          {t(
            'نحتفظ بالحق في تعديل هذه السياسة في أي وقت. ستسري التغييرات على المشتريات التي تتم بعد تاريخ التحديث.',
            'We reserve the right to modify this policy at any time. Changes will apply to purchases made after the update date.',
          )}
        </Section>

        {/* Footer links */}
        <div className="pt-6 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            {t('شروط الاستخدام', 'Terms of Service')}
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            {t('سياسة الخصوصية', 'Privacy Policy')}
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