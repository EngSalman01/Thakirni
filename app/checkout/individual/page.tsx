'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CreditCard, CheckCircle2, Lock } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';

declare global {
  interface Window {
    MoyasarCheckout: any;
  }
}

export default function IndividualCheckout() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'email'>('card');
  const [email, setEmail] = useState('');
  const [completed, setCompleted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Moyasar script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.moyasar.com/mpay/moyasar.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  const handleCardPayment = () => {
    if (!scriptLoaded) {
      toast.error('Payment system loading, please wait...');
      return;
    }

    setLoading(true);

    try {
      if (window.MoyasarCheckout) {
        window.MoyasarCheckout.openCheckout({
          amount: 29 * 100, // 29 SAR in halalas
          currency: 'SAR',
          description: 'Individual subscription - Thakirni',
          publishable_key: process.env.NEXT_PUBLIC_MOYASAR_KEY || 'pk_test_demo',
          callback_url: '/checkout/callback?plan=individual',
          metadata: {
            plan: 'individual',
            subscription_type: 'individual',
          },
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to open payment form');
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
        toast.success('Added to waitlist! Check your email.');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        toast.error(data.message || 'Failed to add to waitlist');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-emerald-500/20 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('تم بنجاح!', 'Success!')}
            </h2>
            <p className="text-muted-foreground">
              {t('شكراً على اشتراكك. جاري إعادة التوجيه...', 'Thank you for subscribing. Redirecting...')}
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
            {t('29 ريال سعودي / الشهر', 'SAR 29 / month')}
          </p>
          <p className="text-muted-foreground mt-2">
            {t('احفظ ذكرياتك وملاحظاتك بأمان', 'Save your memories and notes securely')}
          </p>
        </div>

        {/* Payment Method Selector */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setPaymentMethod('card')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentMethod === 'card'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-border hover:border-emerald-500/50'
            }`}
          >
            <CreditCard className="w-6 h-6 mb-2" />
            <div className="font-semibold text-foreground">{t('بطاقة', 'Card')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('فيزا أو ماستركارد', 'Visa/Mastercard')}
            </p>
          </button>

          <button
            onClick={() => setPaymentMethod('apple')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentMethod === 'apple'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-border hover:border-emerald-500/50'
            }`}
          >
            <div className="text-2xl mb-2">🍎</div>
            <div className="font-semibold text-foreground">{t('Apple Pay', 'Apple Pay')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('سريع وآمن', 'Fast & Secure')}
            </p>
          </button>

          <button
            onClick={() => setPaymentMethod('email')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentMethod === 'email'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-border hover:border-emerald-500/50'
            }`}
          >
            <div className="text-xl mb-2">📧</div>
            <div className="font-semibold text-foreground">{t('قائمة الانتظار', 'Waitlist')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('مجاني', 'Free')}
            </p>
          </button>
        </div>

        {/* Payment Forms */}
        {(paymentMethod === 'card' || paymentMethod === 'apple') ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {t('الدفع الآمن', 'Secure Payment')}
              </CardTitle>
              <CardDescription>
                {t(
                  'معالج آمن من موسى (Moyasar) - البوابة الدفع الرسمية للسعودية',
                  'Powered by Moyasar - Saudi Arabia\'s trusted payment gateway'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {t(
                    'لا نحفظ بيانات بطاقتك. كل شيء معالج مباشرة عبر Moyasar الآمن',
                    'Your card data is never stored. Everything is processed securely through Moyasar.'
                  )}
                </p>
              </div>

              <Button
                onClick={handleCardPayment}
                disabled={loading || !scriptLoaded}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 text-base font-semibold rounded-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {t('جاري المعالجة...', 'Processing...')}
                  </>
                ) : !scriptLoaded ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {t('جاري التحميل...', 'Loading...')}
                  </>
                ) : (
                  t('إتمام الدفع - 29 ريال', 'Pay - SAR 29')
                )}
              </Button>

              {/* Security Badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-muted rounded">
                  <div className="text-lg mb-1">🔒</div>
                  <p className="text-muted-foreground">{t('آمن SSL', 'SSL Secure')}</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="text-lg mb-1">✓</div>
                  <p className="text-muted-foreground">{t('موثوق', 'Verified')}</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="text-lg mb-1">📱</div>
                  <p className="text-muted-foreground">{t('جوال', 'Mobile Ready')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('قائمة الانتظار', 'Waitlist')}</CardTitle>
              <CardDescription>
                {t('أضف بريدك للحصول على إشعار عندما نبدأ الدفع', 'Add your email to get notified when we launch')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSignup} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('البريد الإلكتروني', 'Email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('لن نشارك بريدك مع أحد', 'We will never share your email')}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 text-base font-semibold rounded-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      {t('جاري الإضافة...', 'Adding...')}
                    </>
                  ) : (
                    t('إضافة للقائمة', 'Join Waitlist')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Features List */}
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="text-2xl mb-2">✨</div>
            <p className="font-semibold text-foreground mb-1">{t('ملاحظات غير محدودة', 'Unlimited Notes')}</p>
            <p className="text-xs text-muted-foreground">{t('احفظ ما تريد', 'Save everything')}</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="text-2xl mb-2">🎙️</div>
            <p className="font-semibold text-foreground mb-1">{t('ملاحظات صوتية', 'Voice Notes')}</p>
            <p className="text-xs text-muted-foreground">{t('سجل بصوتك', 'Record your voice')}</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="text-2xl mb-2">🤖</div>
            <p className="font-semibold text-foreground mb-1">{t('مساعد ذكي', 'AI Assistant')}</p>
            <p className="text-xs text-muted-foreground">{t('تحليل ذكي', 'Smart analysis')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
