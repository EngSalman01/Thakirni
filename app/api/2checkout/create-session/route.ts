import { NextRequest, NextResponse } from 'next/server';

const MERCHANT_ID = process.env.NEXT_PUBLIC_2CHECKOUT_MERCHANT_ID;
const API_KEY = process.env['2CHECKOUT_API_KEY'];
const ACCESS_TOKEN = process.env['2CHECKOUT_ACCESS_TOKEN'];

interface CreateSessionRequest {
  productId: string;
  email: string;
  plan: 'individual' | 'team';
  quantity?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSessionRequest = await request.json();

    if (!MERCHANT_ID || !ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Payment configuration missing' },
        { status: 500 }
      );
    }

    const { productId, email, plan } = body;

    // Create checkout session with 2Checkout
    const response = await fetch('https://api.2checkout.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        products: [
          {
            product_id: productId,
            quantity: body.quantity || 1,
          },
        ],
        currency: 'sar',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://thakirni.com'}/vault?plan=${plan}&status=success`,
        language: 'en',
        customer: {
          email,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('2Checkout API error:', error);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      sessionId: data.id,
      redirectUrl: data.redirect_url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
