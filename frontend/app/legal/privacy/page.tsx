import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "سياسة الخصوصية / Privacy Policy — Thakirni",
  description: "سياسة حماية البيانات الشخصية وفق نظام PDPL السعودي / Privacy policy under Saudi PDPL",
}

export default function PrivacyPage() {
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
              سياسة الخصوصية
            </h1>
            <h2 className="text-xl font-headline font-bold opacity-90 mb-4">
              Privacy Policy
            </h2>
            <p className="text-sm opacity-75 font-label">
              آخر تحديث: مارس ٢٠٢٦ · Last updated: March 2026
            </p>
          </div>

          <div className="px-8 py-10 space-y-12">

            {/* Section 1 AR */}
            <section dir="rtl" className="space-y-4">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                ١. البيانات التي نجمعها
              </h3>
              <p className="text-slate-600 leading-relaxed">
                تجمع منصة ذاكرني الأنواع التالية من البيانات عند استخدامك للخدمة:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ms-4">
                <li><strong>بيانات الملف الشخصي:</strong> الاسم، البريد الإلكتروني، رقم الجوال (اختياري)</li>
                <li><strong>محادثات الذكاء الاصطناعي:</strong> نصوص محادثاتك مع المساعد الذكي</li>
                <li><strong>الخطط والأهداف:</strong> جميع خططك اليومية، عاداتك، وأهدافك</li>
                <li><strong>الملاحظات الصوتية والوثائق:</strong> الملفات الصوتية والمستندات التي ترفعها</li>
                <li><strong>بيانات الاستخدام:</strong> إحصائيات الاستخدام الشهري والتفاعل مع الميزات</li>
                <li><strong>بيانات الفوترة:</strong> معلومات الاشتراك (لا نخزن بيانات البطاقة الائتمانية مباشرةً)</li>
              </ul>
            </section>

            {/* Section 1 EN */}
            <section dir="ltr" className="space-y-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-6">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                1. Data We Collect
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Thakirni collects the following types of data when you use our service:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li><strong>Profile data:</strong> Name, email address, phone number (optional)</li>
                <li><strong>AI conversations:</strong> Text of your conversations with the AI assistant</li>
                <li><strong>Plans and goals:</strong> Your daily plans, habits, and goals</li>
                <li><strong>Voice notes and documents:</strong> Audio files and documents you upload</li>
                <li><strong>Usage data:</strong> Monthly usage statistics and feature interaction</li>
                <li><strong>Billing data:</strong> Subscription information (we do not store card details directly)</li>
              </ul>
            </section>

            {/* Section 2 AR */}
            <section dir="rtl" className="space-y-4">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                ٢. لماذا نجمع هذه البيانات
              </h3>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ms-4">
                <li>تقديم خدمات المساعد الذكي والتخطيط والتذكير</li>
                <li>إرسال تذكيرات عبر البريد الإلكتروني أو WhatsApp</li>
                <li>تحسين تجربة المستخدم وتطوير الخدمة</li>
                <li>معالجة المدفوعات وإدارة الاشتراكات</li>
                <li>الامتثال للمتطلبات القانونية والتنظيمية</li>
              </ul>
            </section>

            {/* Section 2 EN */}
            <section dir="ltr" className="space-y-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-6">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                2. Why We Collect This Data
              </h3>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Providing AI assistant, planning, and reminder services</li>
                <li>Sending reminders via email or WhatsApp</li>
                <li>Improving user experience and developing the service</li>
                <li>Processing payments and managing subscriptions</li>
                <li>Complying with legal and regulatory requirements</li>
              </ul>
            </section>

            {/* Section 3 AR */}
            <section dir="rtl" className="space-y-4">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                ٣. الأطراف الثالثة
              </h3>
              <p className="text-slate-600 leading-relaxed">
                نستخدم الخدمات التالية لتشغيل المنصة:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ms-4">
                <li><strong>Supabase:</strong> تخزين البيانات والمصادقة — خوادم في منطقة قريبة من المملكة العربية السعودية</li>
                <li><strong>Google AI (Gemini):</strong> معالجة طلبات الذكاء الاصطناعي — تخضع لسياسة خصوصية Google</li>
                <li><strong>Paddle:</strong> معالجة المدفوعات والفوترة — لا نطلع على بيانات بطاقتك</li>
                <li><strong>cron-job.org:</strong> تنفيذ المهام المجدولة (إرسال التذكيرات)</li>
              </ul>
              <p className="text-slate-500 text-sm">
                نحن لا نبيع بياناتك لأي طرف ثالث تحت أي ظرف كان.
              </p>
            </section>

            {/* Section 3 EN */}
            <section dir="ltr" className="space-y-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-6">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                3. Third Parties
              </h3>
              <p className="text-slate-600 leading-relaxed">
                We use the following services to operate the platform:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li><strong>Supabase:</strong> Data storage and authentication — servers in a region close to Saudi Arabia</li>
                <li><strong>Google AI (Gemini):</strong> AI request processing — subject to Google&apos;s privacy policy</li>
                <li><strong>Paddle:</strong> Payment processing and billing — we never see your card details</li>
                <li><strong>cron-job.org:</strong> Scheduled tasks (sending reminders)</li>
              </ul>
              <p className="text-slate-500 text-sm">
                We do not sell your data to any third party under any circumstances.
              </p>
            </section>

            {/* Section 4 AR */}
            <section dir="rtl" className="space-y-4">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                ٤. حقوقك بموجب نظام PDPL
              </h3>
              <p className="text-slate-600 leading-relaxed">
                بموجب نظام حماية البيانات الشخصية في المملكة العربية السعودية، يحق لك:
              </p>
              <div className="grid gap-3">
                {[
                  { title: "الوصول", desc: "طلب نسخة من جميع بياناتك الشخصية المخزنة لدينا" },
                  { title: "التصحيح", desc: "تعديل أي بيانات غير دقيقة من صفحة الإعدادات" },
                  { title: "الحذف", desc: "حذف حسابك وجميع بياناتك نهائياً في أي وقت" },
                  { title: "التصدير", desc: "تنزيل جميع بياناتك بصيغة JSON من صفحة الإعدادات" },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-3 p-3 bg-slate-50 dark:bg-white/[0.03] rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                    <div>
                      <span className="font-label font-bold text-slate-900">{title}: </span>
                      <span className="text-slate-600">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 4 EN */}
            <section dir="ltr" className="space-y-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-6">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                4. Your Rights Under PDPL
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Under Saudi Arabia&apos;s Personal Data Protection Law (PDPL), you have the right to:
              </p>
              <div className="grid gap-3">
                {[
                  { title: "Access", desc: "Request a copy of all your personal data stored with us" },
                  { title: "Correct", desc: "Update any inaccurate data from the Settings page" },
                  { title: "Delete", desc: "Delete your account and all associated data permanently at any time" },
                  { title: "Export", desc: "Download all your data as JSON from the Settings page" },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-3 p-3 bg-white rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                    <div>
                      <span className="font-label font-bold text-slate-900">{title}: </span>
                      <span className="text-slate-600">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5 AR */}
            <section dir="rtl" className="space-y-4">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                ٥. مدة الاحتفاظ بالبيانات
              </h3>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ms-4">
                <li><strong>سجلات الطلبات:</strong> ٩٠ يوماً ثم تُحذف تلقائياً</li>
                <li><strong>سجلات التدقيق:</strong> سنة واحدة للامتثال القانوني</li>
                <li><strong>بيانات الحساب:</strong> تُحفظ حتى تطلب حذف حسابك</li>
                <li><strong>بيانات الفواتير:</strong> وفق المتطلبات القانونية المحلية (٥ سنوات)</li>
              </ul>
            </section>

            {/* Section 5 EN */}
            <section dir="ltr" className="space-y-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-6">
              <h3 className="text-xl font-headline font-bold text-slate-900 border-b border-[#e4e2e1] pb-2">
                5. Data Retention
              </h3>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li><strong>Request logs:</strong> 90 days, then automatically deleted</li>
                <li><strong>Audit logs:</strong> 1 year for legal compliance</li>
                <li><strong>Account data:</strong> Retained until you request account deletion</li>
                <li><strong>Billing data:</strong> Per local legal requirements (5 years)</li>
              </ul>
            </section>

            {/* Contact */}
            <section className="rounded-xl bg-indigo-600/5 border border-indigo-600/20 p-6 space-y-2">
              <h3 className="font-headline font-bold text-slate-900">
                التواصل معنا / Contact Us
              </h3>
              <p className="text-slate-600 text-sm" dir="rtl">
                لأي استفسار متعلق بالخصوصية أو لممارسة حقوقك، تواصل معنا على:
              </p>
              <p className="text-slate-600 text-sm" dir="ltr">
                For any privacy-related inquiry or to exercise your rights, contact us at:
              </p>
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
