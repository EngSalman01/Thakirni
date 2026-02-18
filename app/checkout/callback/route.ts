import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('payment_id') || searchParams.get('id');
    const status = searchParams.get('status');
    const plan = searchParams.get('plan') || 'individual';

    if (!paymentId) {
      return NextResponse.redirect(new URL('/checkout?error=no_payment_id', request.url));
    }

    // Verify payment with Moyasar
    const moyasarSecretKey = process.env.MOYASAR_SECRET_KEY;
    
    if (!moyasarSecretKey) {
      return NextResponse.redirect(new URL('/checkout?error=config_error', request.url));
    }

    const verifyResponse = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${moyasarSecretKey}:`).toString('base64')}`,
      },
    });

    const paymentData = await verifyResponse.json();

    // Check if payment was successful
    if (paymentData.status !== 'paid') {
      return NextResponse.redirect(new URL('/checkout?error=payment_failed', request.url));
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      // Redirect to sign up with payment reference
      return NextResponse.redirect(
        new URL(`/auth?payment_id=${paymentId}&plan=${plan}`, request.url)
      );
    }

    // Create subscription in database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        subscription_type: plan,
        status: 'active',
        plan_name: plan === 'individual' ? 'Individual' : 'Team',
        payment_id: paymentId,
        payment_method: 'moyasar',
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (subError) {
      console.error('Subscription creation error:', subError);
      return NextResponse.redirect(
        new URL(`/vault?warning=subscription_created_but_payment_recorded&payment_id=${paymentId}`, request.url)
      );
    }

    // Redirect to vault with success message
    return NextResponse.redirect(new URL('/vault?payment=success', request.url));
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(new URL('/checkout?error=processing_error', request.url));
  }
}
