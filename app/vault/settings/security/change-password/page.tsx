'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowRight, Lock } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user) {
    router.push('/auth');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate form
      if (!currentPassword) {
        setErrors({ currentPassword: t('أدخل كلمة المرور الحالية', 'Enter current password') });
        setLoading(false);
        return;
      }
      if (!newPassword) {
        setErrors({ newPassword: t('أدخل كلمة مرور جديدة', 'Enter new password') });
        setLoading(false);
        return;
      }
      if (newPassword.length < 8) {
        setErrors({ newPassword: t('يجب أن تكون 8 أحرف على الأقل', 'Must be at least 8 characters') });
        setLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrors({ confirmPassword: t('كلمات المرور غير متطابقة', 'Passwords do not match') });
        setLoading(false);
        return;
      }

      // Call Supabase API to change password
      const { error } = await (await import('@/lib/supabase/client')).createClient()
        .auth
        .updateUser({ password: newPassword });

      if (error) {
        toast.error(t('فشل تغيير كلمة المرور', 'Failed to change password'));
        setLoading(false);
        return;
      }

      toast.success(t('تم تغيير كلمة المرور بنجاح', 'Password changed successfully'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        router.push('/vault/settings');
      }, 1500);
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(t('حدث خطأ ما', 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 me-2" />
            {t('رجوع', 'Back')}
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {t('تغيير كلمة المرور', 'Change Password')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('حافظ على حسابك آمناً بتحديث كلمة مرورك', 'Keep your account secure by updating your password')}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <label htmlFor="current-password" className="block text-sm font-medium text-foreground">
                {t('كلمة المرور الحالية', 'Current Password')}
              </label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('أدخل كلمة مرورك الحالية', 'Enter your current password')}
                disabled={loading}
                className={errors.currentPassword ? 'border-red-500' : ''}
              />
              {errors.currentPassword && (
                <p className="text-xs text-red-500">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label htmlFor="new-password" className="block text-sm font-medium text-foreground">
                {t('كلمة المرور الجديدة', 'New Password')}
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('أدخل كلمة مرور جديدة', 'Enter a new password')}
                disabled={loading}
                className={errors.newPassword ? 'border-red-500' : ''}
              />
              {errors.newPassword && (
                <p className="text-xs text-red-500">{errors.newPassword}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('يجب أن تكون على الأقل 8 أحرف', 'Must be at least 8 characters')}
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground">
                {t('تأكيد كلمة المرور', 'Confirm Password')}
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('أعد إدخال كلمة مرورك الجديدة', 'Re-enter your new password')}
                disabled={loading}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="flex-1"
              >
                {loading ? t('جاري المعالجة...', 'Processing...') : t('تحديث كلمة المرور', 'Update Password')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => router.back()}
              >
                {t('إلغاء', 'Cancel')}
              </Button>
            </div>
          </form>
        </Card>

        {/* Security Tips */}
        <Card className="p-4 mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            {t('نصائح الأمان', 'Security Tips')}
          </h3>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>• {t('استخدم كلمة مرور قوية تحتوي على أحرف وأرقام ورموز', 'Use a strong password with letters, numbers, and symbols')}</li>
            <li>• {t('لا تشارك كلمة مرورك مع أحد', 'Never share your password with anyone')}</li>
            <li>• {t('غيّر كلمة مرورك بانتظام', 'Change your password regularly')}</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
