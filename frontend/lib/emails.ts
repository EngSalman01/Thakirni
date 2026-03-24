/**
 * Thakirni transactional email service.
 * Sends from info@thakirni.com via Resend.
 * All emails are bilingual (Arabic + English).
 */

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Thakirni <info@thakirni.com>"

// ─── Shared HTML helpers ──────────────────────────────────────────────────────

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f6f3f2;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3f2;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2552ca,#ad1d7f);padding:40px 40px 32px;text-align:center;">
            <div style="font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-1px;">ذكّرني</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;letter-spacing:2px;">THAKIRNI</div>
          </td>
        </tr>
        ${content}
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:12px;color:#cbd5e1;">© ${new Date().getFullYear()} Thakirni · thakirni.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function button(text: string, href: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:8px 0 32px;">
      <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#2552ca,#ad1d7f);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:100px;">
        ${text}
      </a>
    </td></tr>
  </table>`
}

// ─── Email: Subscription Confirmed ────────────────────────────────────────────

export async function sendSubscriptionConfirmed(opts: {
  to: string
  name: string
  planName: string
  planNameAr: string
  amount: string
  currency: string
  nextBillingDate: string
}) {
  const { to, name, planName, planNameAr, amount, currency, nextBillingDate } = opts

  const html = layout(`
    <tr><td style="padding:36px 40px 0;text-align:center;">
      <div style="width:64px;height:64px;background:#f0fdf4;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">🎉</div>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1e293b;text-align:right;">تم تفعيل اشتراكك! 🎉</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.7;text-align:right;">
        هلا ${name}، تم تفعيل اشتراك <strong>${planNameAr}</strong>. تقدر الآن تستفيد من جميع المميزات.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:24px;margin-bottom:28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#166534;text-align:right;padding:4px 0;">الخطة / Plan</td>
            <td style="font-size:14px;font-weight:700;color:#15803d;text-align:left;">${planName}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#166534;text-align:right;padding:4px 0;">المبلغ / Amount</td>
            <td style="font-size:14px;font-weight:700;color:#15803d;text-align:left;">${amount} ${currency}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#166534;text-align:right;padding:4px 0;">التجديد القادم / Next billing</td>
            <td style="font-size:14px;font-weight:700;color:#15803d;text-align:left;">${nextBillingDate}</td>
          </tr>
        </table>
      </div>
      ${button("افتح ذكّرني · Open Thakirni", "https://thakirni.com/vault")}
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 28px;"/>
      <h2 style="margin:0 0 10px;font-size:17px;font-weight:700;color:#1e293b;text-align:left;direction:ltr;">Subscription Activated!</h2>
      <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;text-align:left;direction:ltr;">
        Hi ${name}, your <strong>${planName}</strong> subscription is now active. Enjoy all the premium features!
      </p>
    </td></tr>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: `✅ تم تفعيل اشتراك ${planNameAr} · ${planName} Subscription Active`,
    html,
  })
}

// ─── Email: Payment Receipt ────────────────────────────────────────────────────

export async function sendPaymentReceipt(opts: {
  to: string
  name: string
  planName: string
  planNameAr: string
  amount: string
  currency: string
  invoiceId?: string
  date: string
}) {
  const { to, name, planName, planNameAr, amount, currency, invoiceId, date } = opts

  const html = layout(`
    <tr><td style="padding:36px 40px 0;text-align:center;">
      <div style="width:64px;height:64px;background:#eff6ff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">🧾</div>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1e293b;text-align:right;">إيصال الدفع</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.7;text-align:right;">
        هلا ${name}، تم استلام دفعتك.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${invoiceId ? `<tr>
            <td style="font-size:13px;color:#64748b;text-align:right;padding:4px 0;">رقم الفاتورة / Invoice</td>
            <td style="font-size:13px;font-weight:600;color:#374151;text-align:left;direction:ltr;">${invoiceId}</td>
          </tr>` : ""}
          <tr>
            <td style="font-size:13px;color:#64748b;text-align:right;padding:4px 0;">التاريخ / Date</td>
            <td style="font-size:13px;font-weight:600;color:#374151;text-align:left;">${date}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;text-align:right;padding:4px 0;">الخطة / Plan</td>
            <td style="font-size:13px;font-weight:600;color:#374151;text-align:left;">${planName}</td>
          </tr>
          <tr><td colspan="2" style="padding:8px 0;"><hr style="border:none;border-top:1px solid #e2e8f0;"/></td></tr>
          <tr>
            <td style="font-size:15px;font-weight:800;color:#1e293b;text-align:right;padding:4px 0;">المجموع / Total</td>
            <td style="font-size:15px;font-weight:800;color:#2552ca;text-align:left;">${amount} ${currency}</td>
          </tr>
        </table>
      </div>
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 28px;"/>
      <h2 style="margin:0 0 10px;font-size:17px;font-weight:700;color:#1e293b;text-align:left;direction:ltr;">Payment Receipt</h2>
      <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;text-align:left;direction:ltr;">
        Hi ${name}, your payment of <strong>${amount} ${currency}</strong> for <strong>${planName}</strong> has been received.
      </p>
    </td></tr>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: `🧾 إيصال الدفع · Payment Receipt — ${planNameAr}`,
    html,
  })
}

// ─── Email: Subscription Cancelled ────────────────────────────────────────────

export async function sendSubscriptionCancelled(opts: {
  to: string
  name: string
  planName: string
  planNameAr: string
  accessUntil: string
}) {
  const { to, name, planName, planNameAr, accessUntil } = opts

  const html = layout(`
    <tr><td style="padding:36px 40px 0;text-align:center;">
      <div style="width:64px;height:64px;background:#fff1f2;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">😢</div>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1e293b;text-align:right;">تم إلغاء اشتراكك</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.7;text-align:right;">
        ${name}، تأسفنا لرؤيتك تغادر. تم إلغاء اشتراك <strong>${planNameAr}</strong>. ستحتفظ بوصولك حتى <strong>${accessUntil}</strong>.
      </p>
      <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:16px;margin-bottom:28px;text-align:right;">
        <p style="margin:0;font-size:13px;color:#9f1239;">إذا غيّرت رأيك، تقدر تجدد اشتراكك في أي وقت من إعدادات حسابك.</p>
      </div>
      ${button("إعادة الاشتراك · Resubscribe", "https://thakirni.com/vault/settings")}
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 28px;"/>
      <h2 style="margin:0 0 10px;font-size:17px;font-weight:700;color:#1e293b;text-align:left;direction:ltr;">Subscription Cancelled</h2>
      <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;text-align:left;direction:ltr;">
        Hi ${name}, your <strong>${planName}</strong> subscription has been cancelled. You'll keep access until <strong>${accessUntil}</strong>. We'd love to have you back!
      </p>
    </td></tr>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: `تم إلغاء اشتراكك · Subscription Cancelled`,
    html,
  })
}

// ─── Email: Payment Failed ─────────────────────────────────────────────────────

export async function sendPaymentFailed(opts: {
  to: string
  name: string
  planName: string
  planNameAr: string
}) {
  const { to, name, planName, planNameAr } = opts

  const html = layout(`
    <tr><td style="padding:36px 40px 0;text-align:center;">
      <div style="width:64px;height:64px;background:#fff7ed;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">⚠️</div>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1e293b;text-align:right;">فشلت عملية الدفع</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.7;text-align:right;">
        هلا ${name}، ما قدرنا نجدد اشتراك <strong>${planNameAr}</strong>. لو سمحت حدّث بيانات الدفع لتجنب انقطاع الخدمة.
      </p>
      ${button("تحديث بيانات الدفع · Update Payment", "https://thakirni.com/vault/settings")}
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 28px;"/>
      <h2 style="margin:0 0 10px;font-size:17px;font-weight:700;color:#1e293b;text-align:left;direction:ltr;">Payment Failed</h2>
      <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;text-align:left;direction:ltr;">
        Hi ${name}, we couldn't process your <strong>${planName}</strong> renewal. Please update your payment method to avoid losing access.
      </p>
    </td></tr>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ فشلت عملية الدفع · Payment Failed — ${planNameAr}`,
    html,
  })
}

// ─── Email: Welcome (after signup) ────────────────────────────────────────────

export async function sendWelcome(opts: { to: string; name: string }) {
  const { to, name } = opts

  const html = layout(`
    <tr><td style="padding:36px 40px 0;text-align:center;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">👋</div>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1e293b;text-align:right;">أهلاً وسهلاً في ذكّرني! 🎉</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.7;text-align:right;">
        هلا ${name}! يسعدنا انضمامك. ذكّرني هو مساعدك الذكي الذي يتذكر كل شيء، ينظم وقتك، ويتكلم معاك بالعربي.
      </p>
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:28px;text-align:right;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;">ابدأ بـ:</p>
        <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.8;">
          📅 أضف موعدك القادم<br/>
          🧠 خلّ ذكّرني يتذكر عنك<br/>
          💬 كلّمه بالعربي أو الإنجليزي
        </p>
      </div>
      ${button("افتح ذكّرني · Get Started", "https://thakirni.com/vault")}
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 28px;"/>
      <h2 style="margin:0 0 10px;font-size:17px;font-weight:700;color:#1e293b;text-align:left;direction:ltr;">Welcome to Thakirni!</h2>
      <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;text-align:left;direction:ltr;">
        Hey ${name}! We're glad you're here. Thakirni is your AI assistant that remembers everything, organizes your schedule, and talks to you in Arabic or English.
      </p>
    </td></tr>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: `أهلاً في ذكّرني · Welcome to Thakirni 👋`,
    html,
  })
}
