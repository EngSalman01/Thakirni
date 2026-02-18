import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body.event;

    console.log('[v0] 2Checkout webhook received:', event);

    // Handle different webhook events
    switch (event) {
      case 'subscription.activated':
        return await handleSubscriptionActivated(body);
      
      case 'subscription.created':
        return await handleSubscriptionCreated(body);
      
      case 'subscription.cancelled':
        return await handleSubscriptionCancelled(body);
      
      default:
        return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActivated(body: any) {
  try {
    const { subscription, customer } = body;
    const email = customer.email;
    const subscriptionId = subscription.id;

    // Get plan type from product ID or metadata
    const planType = subscription.product_id.includes('team') ? 'team' : 'individual';

    // Update waitlist record with subscription info
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({
        subscription_status: 'active',
        subscription_id: subscriptionId,
        plan_type: planType,
        activated_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    console.log(`[v0] Subscription activated for ${email} - Plan: ${planType}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription activation error:', error);
    return NextResponse.json({ success: false });
  }
}

async function handleSubscriptionCreated(body: any) {
  try {
    const { customer } = body;
    const email = customer.email;

    console.log(`[v0] Subscription created for ${email}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ success: false });
  }
}

async function handleSubscriptionCancelled(body: any) {
  try {
    const { subscription, customer } = body;
    const email = customer.email;

    // Update subscription status
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({
        subscription_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    console.log(`[v0] Subscription cancelled for ${email}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json({ success: false });
  }
}
