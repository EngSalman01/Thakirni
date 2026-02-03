'use client'

import { useCallback, useState } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { startSubscriptionCheckout } from '@/app/actions/stripe'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SUBSCRIPTION_PLANS, formatPrice } from '@/lib/products'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutProps {
  planId: string
  billingPeriod?: 'monthly' | 'yearly'
}

export function Checkout({ planId, billingPeriod = 'monthly' }: CheckoutProps) {
  const startCheckoutSessionForPlan = useCallback(
    () => startSubscriptionCheckout(planId, billingPeriod),
    [planId, billingPeriod],
  )

  return (
    <div id="checkout" className="w-full max-w-lg mx-auto">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret: startCheckoutSessionForPlan }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}

interface PricingCardsProps {
  onSelectPlan: (planId: string) => void
  currentPlan?: string
  billingPeriod: 'monthly' | 'yearly'
  onBillingPeriodChange: (period: 'monthly' | 'yearly') => void
}

export function PricingCards({ 
  onSelectPlan, 
  currentPlan = 'free',
  billingPeriod,
  onBillingPeriodChange 
}: PricingCardsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free' || planId === currentPlan) return
    setLoading(planId)
    try {
      onSelectPlan(planId)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex justify-center items-center gap-4">
        <Button
          variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
          onClick={() => onBillingPeriodChange('monthly')}
          className={billingPeriod === 'monthly' ? '' : 'bg-transparent'}
        >
          شهري
        </Button>
        <Button
          variant={billingPeriod === 'yearly' ? 'default' : 'outline'}
          onClick={() => onBillingPeriodChange('yearly')}
          className={billingPeriod === 'yearly' ? '' : 'bg-transparent'}
        >
          سنوي
          <span className="ms-2 text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full">
            شهرين مجاناً
          </span>
        </Button>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const price = billingPeriod === 'yearly' ? plan.priceYearlyInCents : plan.priceInCents
          const isCurrentPlan = plan.id === currentPlan
          const isFree = plan.id === 'free'

          return (
            <Card 
              key={plan.id}
              className={cn(
                "relative overflow-hidden transition-all",
                plan.recommended && "border-primary shadow-lg scale-105",
                isCurrentPlan && "ring-2 ring-primary"
              )}
            >
              {plan.recommended && (
                <div className="absolute top-0 end-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">
                  الأكثر شعبية
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.nameAr}</CardTitle>
                <CardDescription>{plan.descriptionAr}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {isFree ? 'مجاني' : formatPrice(price)}
                  </span>
                  {!isFree && (
                    <span className="text-muted-foreground text-sm">
                      /{billingPeriod === 'yearly' ? 'سنة' : 'شهر'}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.featuresAr.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.recommended ? 'default' : 'outline'}
                  disabled={isCurrentPlan || loading === plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {loading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    'خطتك الحالية'
                  ) : isFree ? (
                    'البدء مجاناً'
                  ) : (
                    'اشترك الآن'
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
