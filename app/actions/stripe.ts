'use server'

import { stripe } from '@/lib/stripe'
import { SUBSCRIPTION_PLANS } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'

export async function startSubscriptionCheckout(planId: string, billingPeriod: 'monthly' | 'yearly' = 'monthly') {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
  if (!plan) {
    throw new Error(`Plan with id "${planId}" not found`)
  }

  if (plan.id === 'free') {
    throw new Error('Cannot checkout free plan')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const priceInCents = billingPeriod === 'yearly' ? plan.priceYearlyInCents : plan.priceInCents

  // Create Checkout Session for subscription
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    customer_email: user?.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${plan.name} Plan - ${billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'}`,
            description: plan.description,
          },
          unit_amount: priceInCents,
          recurring: {
            interval: billingPeriod === 'yearly' ? 'year' : 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    metadata: {
      planId: plan.id,
      userId: user?.id || '',
      billingPeriod,
    },
  })

  return session.client_secret
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  return subscription
}

export async function getSubscriptionStatus(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return {
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  }
}
