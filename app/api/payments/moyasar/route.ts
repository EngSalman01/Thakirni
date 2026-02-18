import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, description, metadata } = body;

    // Validate required fields
    if (!amount || !currency) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create payment intent with Moyasar
    const moyasarSecretKey = process.env.MOYASAR_SECRET_KEY;
    
    if (!moyasarSecretKey) {
      console.error('MOYASAR_SECRET_KEY not configured');
      return NextResponse.json(
        { success: false, message: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${moyasarSecretKey}:`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency: currency,
        description: description,
        source: 'src_online_checkout',
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/callback`,
        metadata: JSON.stringify(metadata || {}),
      }).toString(),
    });

    const paymentData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Payment processing failed', error: paymentData },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      payment: paymentData,
      checkout_url: paymentData.redirect_url || `/checkout/payment?id=${paymentData.id}`,
    });
  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
