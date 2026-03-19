'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Mail } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';

export default function IndividualCheckout() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [completed, setCompleted] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email) {
        toast.error(t('يرجى إدخال بريدك الإلكتروني', 'Please enter your email'));
        setLoading(false);
        return;
      }

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          plan: 'individual',
          country: 'SA',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCompleted(true);
        toast.success(t('تم! تحقق من بريدك', 'Success! Check your email'));
        setTimeout(() => {
          router.push('/auth');
        }, 2000);
      } else if (data.message?.includes('already')) {
        toast.info(t('أنت مسجل بالفعل', 'Already registered'));
        setTimeout(() => {
          router.push('/auth');
        }, 1500);
      } else {
        toast.error(data.message || t('حدث خطأ', 'An error occurred'));
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(t('خطأ في الاتصال', 'Connection error'));
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="border-emerald-500/30 bg-emerald-500/5 w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-emerald-500/20 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('تم التسجيل!', 'Registered!')}
            </h2>
            <p className="text-muted-foreground mb-2">
              {t('سيتم إعادة توجيهك لتسجيل الدخول...', 'Redirecting to login...')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('تحقق من بريدك للمزيد من المعلومات', 'Check your email for more info')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t('باقة الأفراد', 'Individual Plan')}
          </h1>
          <p className="text-xl text-emerald-600 dark:text-emerald-500 font-semibold">
            {t('مجاني', 'Completely Free')}
          </p>
          <p className="text-muted-foreground mt-2">
            {t('احفظ ذكرياتك بأمان - لا توجد رسوم مخفية', 'Save your memories securely - No hidden fees')}
          </p>
        </div>

        {/* Main Signup Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {t('ابدأ مجاناً الآن', 'Get Started for Free')}
            </CardTitle>
            <CardDescription>
              {t('لا توجد بطاقة ائتمان مطلوبة', 'No credit card required')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">{t('البريد الإلكتروني', 'Email Address')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  {t('سنرسل لك رابط التحقق', 'We\'ll send you a verification link')}
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                  {t('✓ مجاني تماماً', '✓ Completely Free')}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  {t('لا توجد اشتراكات أو رسوم. استمتع بجميع المميزات مجاناً للأبد.', 'No subscriptions or fees. Enjoy all features for free forever.')}
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 text-base font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {t('جاري...', 'Loading...')}
                  </>
                ) : (
                  t('ابدأ الآن', 'Get Started')
                )}
              </Button>

              {/* Already registered */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {t('لديك حساب بالفعل؟', 'Already have an account?')}
                </span>
                <Button
                  type="button"
                  variant="link"
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                  onClick={() => router.push('/auth')}
                >
                  {t('سجل دخولك', 'Login')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Features List */}
        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-foreground text-lg">{t('المميزات المتضمنة:', 'Included Features:')}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: '✨', title: t('ملاحظات غير محدودة', 'Unlimited Notes'), desc: t('احفظ كل شيء', 'Save everything') },
              { icon: '🎙️', title: t('ملاحظات صوتية', 'Voice Notes'), desc: t('سجل بصوتك', 'Record your voice') },
              { icon: '🤖', title: t('مساعد ذكي', 'AI Assistant'), desc: t('تحليل ذكي', 'Smart analysis') },
              { icon: '🔐', title: t('آمن تماماً', 'Fully Secure'), desc: t('تشفير من الطرف إلى الطرف', 'End-to-end encrypted') },
            ].map((feature, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors">
                <div className="text-2xl mb-2">{feature.icon}</div>
                <p className="font-semibold text-foreground mb-1">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">100%</p>
                <p className="text-xs text-muted-foreground">{t('مجاني', 'Free')}</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground">{t('رسوم مخفية', 'Hidden Fees')}</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">∞</p>
                <p className="text-xs text-muted-foreground">{t('بلا حدود', 'Unlimited')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
