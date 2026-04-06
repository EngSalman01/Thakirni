import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "شروط الخدمة / Terms of Service — Thakirni",
  description: "شروط وأحكام استخدام منصة ذاكرني / Thakirni Terms of Service",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-label text-slate-500 hover:text-slate-900 transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة / Back
        </Link>

        <div className="bg-white rounded-2xl border border-[#e4e2e1] overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-8 py-10 text-white">
            <h1 className="text-3xl font-headline font-extrabold mb-2">
              شروط الخدمة
            </h1>
            <h2 className="text-xl font-headline font-bold opacity-90 mb-4">
              Terms of Service
            </h2>
            <p className="text-sm opacity-75 font-label">
              آخر تحديث: مارس ٢٠٢٦ · Last updated: March 2026
            </p>
          </div>

          <div className="px-8 py-10 space-y-12">

            {/* Section 1 AR */}
            <section dir="rtl" className="space-y-4">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                ١. وصف الخدمة
              </h3>
              <p className="text-slate-600 leading-relaxed">
                ذاكرني هي منصة إنتاجية مدعومة بالذكاء الاصطناعي تساعدك على تنظيم حياتك
                من خلال التخطيط الذكي، وتتبع العادات، وإدارة الأهداف، والتذكيرات التلقائية
                عبر البريد الإلكتروني وWhatsApp. تعمل المنصة عبر المتصفح وتُقدَّم كخدمة
                قائمة على الاشتراك (SaaS).
              </p>
            </section>

            {/* Section 1 EN */}
            <section dir="ltr" className="space-y-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-6">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                1. Service Description
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Thakirni is an AI-powered productivity platform that helps you organize your
                life through smart planning, habit tracking, goal management, and automated
                reminders via email and WhatsApp. The platform operates via browser and is
                delivered as a subscription-based service (SaaS).
              </p>
            </section>

            {/* Section 2 AR */}
            <section dir="rtl" className="space-y-4">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                ٢. الاستخدام المقبول
              </h3>
              <p className="text-slate-600 leading-relaxed">
                يوافق المستخدم على عدم استخدام المنصة في:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ms-4">
                <li>أي نشاط غير قانوني أو ينتهك الأنظمة السعودية أو الدولية</li>
                <li>نشر محتوى مسيء أو تهديدي أو مضلل</li>
                <li>محاولة اختراق الأنظمة أو الوصول إلى بيانات مستخدمين آخرين</li>
                <li>إساءة استخدام واجهة برمجة التطبيقات (API) أو تجاوز الحدود المحددة</li>
                <li>أي نشاط يضر بسمعة المنصة أو أمانها</li>
              </ul>
            </section>

            {/* Section 2 EN */}
            <section dir="ltr" className="space-y-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-6">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                2. Acceptable Use
              </h3>
              <p className="text-slate-600 leading-relaxed">
                You agree not to use the platform for:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Any activity that is illegal or violates Saudi or international regulations</li>
                <li>Publishing offensive, threatening, or misleading content</li>
                <li>Attempting to breach systems or access other users&apos; data</li>
                <li>Abusing the API or exceeding defined usage limits</li>
                <li>Any activity that harms the platform&apos;s reputation or security</li>
              </ul>
            </section>

            {/* Section 3 AR */}
            <section dir="rtl" className="space-y-4">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                ٣. الاشتراك والفوترة
              </h3>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ms-4">
                <li>تتوفر خطط مجانية ومدفوعة (Pro و Teams)</li>
                <li>تُعالَج المدفوعات عبر Paddle بصيغة SAR (ريال سعودي)</li>
                <li>
                  <strong>ضريبة القيمة المضافة (VAT):</strong> تُطبَّق نسبة ١٥٪ على
                  جميع الاشتراكات للمستخدمين المقيمين في المملكة العربية السعودية وفق
                  لوائح هيئة الزكاة والضريبة والجمارك (ZATCA)
                </li>
                <li>يمكن إلغاء الاشتراك في أي وقت؛ يبقى نشطاً حتى نهاية دورة الفوترة</li>
                <li>لا تُقدَّم استردادات للفترات المنقضية</li>
              </ul>
            </section>

            {/* Section 3 EN */}
            <section dir="ltr" className="space-y-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-6">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                3. Subscription & Billing
              </h3>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Free and paid plans are available (Pro and Teams)</li>
                <li>Payments are processed via Paddle in SAR (Saudi Riyals)</li>
                <li>
                  <strong>VAT (15%):</strong> Applied to all subscriptions for users resident
                  in Saudi Arabia per ZATCA (Zakat, Tax and Customs Authority) regulations
                </li>
                <li>Subscriptions can be cancelled at any time; remain active until end of billing cycle</li>
                <li>No refunds are provided for elapsed billing periods</li>
              </ul>
            </section>

            {/* Section 4 AR */}
            <section dir="rtl" className="space-y-4">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                ٤. ملكية البيانات
              </h3>
              <p className="text-slate-600 leading-relaxed">
                <strong>بياناتك ملكك أنت.</strong> لا تدّعي ذاكرني أي حقوق ملكية على
                المحتوى الذي تُنشئه أو تحمّله. نحن نعالج بياناتك فقط لتقديم الخدمة
                المتفق عليها. يمكنك تصدير أو حذف بياناتك في أي وقت من صفحة الإعدادات.
              </p>
            </section>

            {/* Section 4 EN */}
            <section dir="ltr" className="space-y-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-6">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                4. Data Ownership
              </h3>
              <p className="text-slate-600 leading-relaxed">
                <strong>Your data is yours.</strong> Thakirni claims no ownership rights over
                content you create or upload. We process your data solely to deliver the agreed
                service. You may export or delete your data at any time from the Settings page.
              </p>
            </section>

            {/* Section 5 AR */}
            <section dir="rtl" className="space-y-4">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                ٥. تحديد المسؤولية
              </h3>
              <p className="text-slate-600 leading-relaxed">
                تُقدَّم الخدمة &quot;كما هي&quot; دون ضمانات صريحة أو ضمنية. لا تتحمل ذاكرني
                المسؤولية عن أي أضرار غير مباشرة أو عرضية أو تبعية ناتجة عن استخدام
                الخدمة أو عدم القدرة على استخدامها. الحد الأقصى لمسؤوليتنا هو المبلغ
                الذي دفعته خلال الاثني عشر شهراً السابقة.
              </p>
            </section>

            {/* Section 5 EN */}
            <section dir="ltr" className="space-y-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-6">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                5. Limitation of Liability
              </h3>
              <p className="text-slate-600 leading-relaxed">
                The service is provided &quot;as is&quot; without express or implied warranties.
                Thakirni is not liable for any indirect, incidental, or consequential damages
                arising from use of or inability to use the service. Our maximum liability is
                limited to the amount you paid in the preceding twelve months.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-4 rounded-xl bg-indigo-600/5 border border-indigo-600/20 p-6">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-indigo-600/20 pb-2">
                القانون الحاكم / Governing Law
              </h3>
              <p className="text-slate-600 leading-relaxed" dir="rtl">
                تخضع هذه الشروط وتُفسَّر وفق قوانين المملكة العربية السعودية.
                تختص المحاكم السعودية بالنظر في أي نزاع ينشأ عن هذه الشروط.
              </p>
              <p className="text-slate-600 leading-relaxed" dir="ltr">
                These terms are governed by and construed in accordance with the laws of
                the Kingdom of Saudi Arabia. Saudi courts have exclusive jurisdiction over
                any dispute arising from these terms.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-2">
              <h3 className="font-headline font-bold text-slate-900">
                التواصل معنا / Contact Us
              </h3>
              <a
                href="mailto:support@thakirni.com"
                className="inline-block font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                dir="ltr"
              >
                support@thakirni.com
              </a>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
