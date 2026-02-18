import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, plan, cardData } = await request.json();

    // In test mode, validate test card and approve
    // Real implementation would call Stripe API
    if (cardData.number === '4242424242424242') {
      // Test card - simulate successful payment
      return NextResponse.json({
        success: true,
        paymentId: `pi_test_${Date.now()}`,
        plan,
        amount,
        currency,
      });
    }

    // For any other card, reject in test mode
    return NextResponse.json({
      error: 'In test mode, use card: 4242 4242 4242 4242',
    }, { status: 400 });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}
