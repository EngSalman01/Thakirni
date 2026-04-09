#!/usr/bin/env python3
"""
Apply Thakirni branded email templates to Supabase.
Usage: python3 scripts/update-email-templates.py <SUPABASE_PAT>

Get a Personal Access Token from:
https://supabase.com/dashboard/account/tokens
"""
import sys, json, urllib.request

PROJECT_REF = "nzetbvkkxairfglmougn"
PAT = sys.argv[1] if len(sys.argv) > 1 else input("Supabase PAT: ").strip()

# ─── BASE HTML TEMPLATE ──────────────────────────────────────────────────────
def make_template(arabic_title, arabic_body, english_title, english_body, cta_text_ar, cta_text_en, cta_url_var, extra_note=""):
    return f"""<!DOCTYPE html>
<html lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Thakirni · ذكرني</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f4f2;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4f2;">
<tr><td align="center" style="padding:40px 16px;">
<table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;">

  <!-- HEADER -->
  <tr>
    <td style="background:linear-gradient(135deg,#92400e 0%,#b45309 35%,#d97706 70%,#f59e0b 100%);border-radius:18px 18px 0 0;padding:30px 44px;text-align:center;">
      <table cellpadding="0" cellspacing="0" border="0" align="center">
      <tr>
        <td style="background:rgba(255,255,255,0.2);border-radius:14px;width:54px;height:54px;text-align:center;vertical-align:middle;">
          <span style="font-size:30px;color:#ffffff;font-weight:600;line-height:54px;display:block;">ذ</span>
        </td>
        <td width="14"></td>
        <td style="vertical-align:middle;text-align:left;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;line-height:1.2;">Thakirni</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.78);margin-top:3px;letter-spacing:0.3px;">ذكرني</div>
        </td>
      </tr>
      </table>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="background:#ffffff;padding:38px 44px 32px;border-left:1px solid #e5e2e0;border-right:1px solid #e5e2e0;">

      <!-- Arabic block (RTL) -->
      <div style="direction:rtl;text-align:right;margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid #f0eeec;">
        <h1 style="margin:0 0 10px;font-size:21px;font-weight:700;color:#1b1c1c;line-height:1.3;">{arabic_title}</h1>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.75;">{arabic_body}</p>
      </div>

      <!-- English block (LTR) -->
      <div style="direction:ltr;text-align:left;margin-bottom:30px;">
        <h2 style="margin:0 0 9px;font-size:19px;font-weight:700;color:#1b1c1c;line-height:1.3;">{english_title}</h2>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.75;">{english_body}</p>
      </div>

      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center" style="padding-bottom:26px;">
        <a href="{cta_url_var}"
           style="display:inline-block;background:linear-gradient(135deg,#b45309,#d97706);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:15px 48px;border-radius:11px;letter-spacing:0.1px;box-shadow:0 4px 14px rgba(180,83,9,0.3);">
          {cta_text_ar} &nbsp;|&nbsp; {cta_text_en}
        </a>
      </td></tr>
      </table>
{f'''
      <!-- Extra note -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;margin-bottom:20px;direction:ltr;">
        <p style="margin:0;font-size:12px;color:#92400e;line-height:1.6;">{extra_note}</p>
      </div>
''' if extra_note else ''}
      <!-- Fallback link -->
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.75;word-break:break-all;">
        إذا لم يعمل الزر / If the button doesn't work, copy this link:<br>
        <a href="{cta_url_var}" style="color:#d97706;text-decoration:underline;">{cta_url_var}</a>
      </p>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#f9f7f5;border-radius:0 0 18px 18px;border:1px solid #e5e2e0;border-top:none;padding:20px 44px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.8;">
        © 2026 <strong style="color:#6b7280;">Thakirni · ذكرني</strong><br>
        لم تطلب هذا؟ يمكنك تجاهل هذا البريد بأمان.<br>
        Didn't request this? You can safely ignore this email.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>"""


# ─── TEMPLATES ───────────────────────────────────────────────────────────────

TEMPLATES = {
    # Confirm signup
    "mailer_subjects_confirmation": "تأكيد بريدك الإلكتروني | Confirm your email — Thakirni",
    "mailer_templates_confirmation_content": make_template(
        arabic_title="أكّد بريدك الإلكتروني 📬",
        arabic_body="أهلاً بك في ذكرني! خطوة واحدة تفصلك عن البدء — انقر على الزر أدناه لتأكيد بريدك الإلكتروني وتفعيل حسابك.",
        english_title="Confirm your email address 📬",
        english_body="Welcome to Thakirni! You're one step away from getting started — click the button below to verify your email and activate your account.",
        cta_text_ar="تأكيد البريد",
        cta_text_en="Confirm Email",
        cta_url_var="{{ .ConfirmationURL }}",
    ),

    # Password reset
    "mailer_subjects_recovery": "إعادة تعيين كلمة المرور | Reset your password — Thakirni",
    "mailer_templates_recovery_content": make_template(
        arabic_title="إعادة تعيين كلمة المرور 🔐",
        arabic_body="تلقّينا طلباً لإعادة تعيين كلمة مرور حسابك. انقر على الزر أدناه لاختيار كلمة مرور جديدة. الرابط صالح لمدة ساعة واحدة فقط.",
        english_title="Reset your password 🔐",
        english_body="We received a request to reset your Thakirni account password. Click the button below to set a new password. This link is valid for 1 hour.",
        cta_text_ar="إعادة التعيين",
        cta_text_en="Reset Password",
        cta_url_var="{{ .ConfirmationURL }}",
        extra_note="If you didn't request a password reset, please ignore this email — your account is safe. لم تطلب إعادة التعيين؟ تجاهل هذا البريد، حسابك بأمان.",
    ),

    # Magic link / OTP sign-in
    "mailer_subjects_magic_link": "رابط الدخول | Your sign-in link — Thakirni",
    "mailer_templates_magic_link_content": make_template(
        arabic_title="رابط الدخول الخاص بك ✨",
        arabic_body="طلبت رابط دخول سريع لحسابك في ذكرني. انقر على الزر أدناه للدخول مباشرةً — الرابط صالح لمدة ٢٤ ساعة ولاستخدام واحد فقط.",
        english_title="Your magic sign-in link ✨",
        english_body="You requested a sign-in link for your Thakirni account. Click the button below to sign in instantly — this link is valid for 24 hours and can only be used once.",
        cta_text_ar="دخول",
        cta_text_en="Sign In",
        cta_url_var="{{ .ConfirmationURL }}",
        extra_note="This link expires after one use. If you didn't request this, no action is needed. هذا الرابط للاستخدام مرة واحدة فقط.",
    ),

    # Email change confirmation
    "mailer_subjects_email_change": "تأكيد تغيير البريد الإلكتروني | Confirm email change — Thakirni",
    "mailer_templates_email_change_content": make_template(
        arabic_title="تأكيد تغيير بريدك الإلكتروني 📧",
        arabic_body="تلقّينا طلباً لتغيير بريدك الإلكتروني إلى العنوان الجديد. انقر على الزر أدناه لتأكيد هذا التغيير.",
        english_title="Confirm your email change 📧",
        english_body="A request was made to change the email address on your Thakirni account. Click the button below to confirm this change.",
        cta_text_ar="تأكيد التغيير",
        cta_text_en="Confirm Change",
        cta_url_var="{{ .ConfirmationURL }}",
        extra_note="If you didn't request this change, please secure your account immediately. لم تطلب هذا؟ أمّن حسابك فوراً.",
    ),

    # Team invite
    "mailer_subjects_invite": "دعوة للانضمام إلى ذكرني | You're invited to Thakirni",
    "mailer_templates_invite_content": make_template(
        arabic_title="تمت دعوتك للانضمام إلى ذكرني! 🎉",
        arabic_body="تمت دعوتك للانضمام إلى فريق على منصة ذكرني. انقر على الزر أدناه لقبول الدعوة وإنشاء حسابك أو تسجيل الدخول.",
        english_title="You've been invited to Thakirni! 🎉",
        english_body="You've been invited to join a team on Thakirni. Click the button below to accept the invitation and create your account or sign in.",
        cta_text_ar="قبول الدعوة",
        cta_text_en="Accept Invitation",
        cta_url_var="{{ .ConfirmationURL }}",
    ),
}

# ─── APPLY ───────────────────────────────────────────────────────────────────

url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth"
payload = json.dumps(TEMPLATES).encode("utf-8")

req = urllib.request.Request(
    url,
    data=payload,
    method="PATCH",
    headers={
        "Authorization": f"Bearer {PAT}",
        "Content-Type": "application/json",
    },
)

try:
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode()
        print(f"✅ Success ({resp.status})")
        result = json.loads(body)
        keys = [k for k in result if "template" in k or "subject" in k]
        print(f"   Updated {len(keys)} template fields")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"❌ Error {e.code}: {body}")
    sys.exit(1)
