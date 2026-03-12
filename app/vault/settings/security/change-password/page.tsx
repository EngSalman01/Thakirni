'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Lock, Eye, EyeOff,
  ShieldCheck, AlertCircle,
} from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { VaultSidebar } from '@/components/thakirni/vault-sidebar';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Password strength (reused from auth page logic) ───────────────────────────

function getStrength(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const c = Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
  return {
    score: c,
    ...({
      0: { label: 'Too short', color: 'bg-destructive' },
      1: { label: 'Weak', color: 'bg-destructive' },
      2: { label: 'Fair', color: 'bg-yellow-500' },
      3: { label: 'Good', color: 'bg-blue-500' },
      4: { label: 'Strong', color: 'bg-emerald-500' },
    }[c]),
  };
}

// ── Password field ────────────────────────────────────────────────────────────

function PasswordField({
  id, label, value, onChange, placeholder, error, disabled, showStrength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  showStrength?: boolean;
}) {
  const [show, setShow] = useState(false);
  const strength = getStrength(value);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          dir="ltr"
          className={cn('ps-10 pe-10', error && 'border-destructive')}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Strength bar */}
      {showStrength && value.length > 0 && (
        <div className="space-y-1 pt-0.5">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors duration-300',
                  i <= strength.score ? strength.color : 'bg-muted',
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{strength.label}</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      <main className="lg:me-64 p-6 md:p-8">
        <div className="max-w-xl mx-auto space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </main>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChangePasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Auth check ──────────────────────────────────────────────────────────

  useEffect(() => {
    const check = async () => {
      try {
        const supabase = createClient();
        // getUser() calls the server — safe for auth decisions
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/auth'); return; }

        // Detect OAuth users (Google etc.) — they have no password to change
        const isOAuth = user.app_metadata?.provider !== 'email';
        setIsOAuthUser(isOAuth);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [router]);

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!currentPw) newErrors.currentPw = t('أدخل كلمة مرورك الحالية', 'Enter your current password');
    if (!newPw) newErrors.newPw = t('أدخل كلمة مرور جديدة', 'Enter a new password');
    else if (newPw.length < 8)
      newErrors.newPw = t('يجب أن تكون 8 أحرف على الأقل', 'Must be at least 8 characters');
    if (newPw === currentPw)
      newErrors.newPw = t('يجب أن تختلف عن كلمة المرور الحالية', 'Must differ from current password');
    if (newPw !== confirmPw)
      newErrors.confirmPw = t('كلمات المرور غير متطابقة', 'Passwords do not match');

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const supabase = createClient();

      // Get current user email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user session');

      // Re-authenticate to verify current password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });

      if (authError) {
        setErrors({ currentPw: t('كلمة المرور الحالية غير صحيحة', 'Current password is incorrect') });
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
      if (updateError) throw updateError;

      toast.success(t('تم تغيير كلمة المرور بنجاح ✅', 'Password changed successfully ✅'));
      setCurrentPw(''); setNewPw(''); setConfirmPw('');

      setTimeout(() => router.push('/vault/settings'), 1500);
    } catch (err: any) {
      console.error('[ChangePassword]', err);
      toast.error(t('حدث خطأ، حاول مرة أخرى', 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────

  if (checking) return <PageSkeleton />;

  // ── OAuth user — can't change password ──────────────────────────────────

  if (isOAuthUser) {
    return (
      <div className="min-h-screen bg-background">
        <VaultSidebar />
        <main className="lg:me-64 p-6 md:p-8">
          <div className="max-w-xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              {t('رجوع', 'Back')}
            </Button>
            <Card className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">
                {t('تسجيل الدخول عبر Google', 'Signed in with Google')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  'حسابك مرتبط بـ Google. لتغيير كلمة المرور، يرجى التوجه إلى إعدادات حساب Google.',
                  'Your account uses Google sign-in. To change your password, please visit your Google account settings.',
                )}
              </p>
              <Button variant="outline" onClick={() => router.back()}>
                {t('رجوع', 'Go Back')}
              </Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />

      <main className="lg:me-64 p-6 md:p-8">
        <div className="max-w-xl mx-auto">

          {/* Back */}
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t('رجوع', 'Back')}
          </Button>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t('تغيير كلمة المرور', 'Change Password')}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('حافظ على حسابك آمناً', 'Keep your account secure')}
              </p>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('تحديث كلمة المرور', 'Update Password')}
                </CardTitle>
                <CardDescription>
                  {t(
                    'ستحتاج إلى إدخال كلمة مرورك الحالية للتأكيد',
                    'You\'ll need to confirm your current password first',
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <PasswordField
                    id="current-pw"
                    label={t('كلمة المرور الحالية', 'Current Password')}
                    value={currentPw}
                    onChange={setCurrentPw}
                    placeholder={t('أدخل كلمة مرورك الحالية', 'Enter your current password')}
                    error={errors.currentPw}
                    disabled={loading}
                  />

                  <PasswordField
                    id="new-pw"
                    label={t('كلمة المرور الجديدة', 'New Password')}
                    value={newPw}
                    onChange={setNewPw}
                    placeholder={t('أدخل كلمة مرور جديدة', 'Enter a new password')}
                    error={errors.newPw}
                    disabled={loading}
                    showStrength
                  />

                  <PasswordField
                    id="confirm-pw"
                    label={t('تأكيد كلمة المرور', 'Confirm Password')}
                    value={confirmPw}
                    onChange={setConfirmPw}
                    placeholder={t('أعد إدخال كلمة المرور الجديدة', 'Re-enter your new password')}
                    error={errors.confirmPw}
                    disabled={loading}
                  />

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={loading || !currentPw || !newPw || !confirmPw}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          {t('جاري المعالجة...', 'Updating...')}
                        </span>
                      ) : (
                        t('تحديث كلمة المرور', 'Update Password')
                      )}
                    </Button>
                    <Button type="button" variant="outline" disabled={loading} onClick={() => router.back()}>
                      {t('إلغاء', 'Cancel')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mt-5 bg-muted/40 border-muted">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('نصائح الأمان', 'Security Tips')}
                  </h3>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {[
                    { ar: 'استخدم كلمة مرور قوية تحتوي على أحرف وأرقام ورموز', en: 'Use letters, numbers, and symbols' },
                    { ar: 'لا تشارك كلمة مرورك مع أحد', en: 'Never share your password' },
                    { ar: 'غيّر كلمة مرورك بانتظام', en: 'Change your password regularly' },
                    { ar: 'تجنّب استخدام نفس كلمة المرور في مواقع أخرى', en: 'Avoid reusing passwords elsewhere' },
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                      {t(tip.ar, tip.en)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </main>
    </div>
  );
}