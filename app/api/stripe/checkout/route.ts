import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

const PRO_PRICE_ID = process.env.STRIPE_PRICE_ID_PRO_MONTHLY;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!PRO_PRICE_ID) {
        return new NextResponse("Stripe Price ID missing. Check .env file.", { status: 500 });
    }

    // Check if user already has a stripe customer id in profiles
    const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .single();

    let customerId = profile?.stripe_customer_id;

    // If no customer ID, create one in Stripe
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email || undefined,
            name: user.user_metadata?.full_name,
            metadata: {
                userId: user.id
            }
        });
        customerId = customer.id;

        // Save it to profiles
        await supabase
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", user.id);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/vault/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/vault/settings?canceled=true`,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
