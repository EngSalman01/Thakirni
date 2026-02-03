import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  // Using 'await' with headers() is required in newer Next.js versions, but for now we follow current stable.
  // If 'headers' functions as sync:
  const signature = (await headers()).get("Stripe-Signature") as string;
  // If headers is not async in your version, remove 'await'. 

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const supabase = await createClient();

  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    if (!session?.metadata?.userId) {
      return new NextResponse("User ID is missing in metadata", { status: 400 });
    }

    await supabase
      .from("profiles")
      .update({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        stripe_price_id: subscription.items.data[0].price.id,
        stripe_current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        plan_tier: "INDIVIDUAL", // Or whatever your Pro tier logic is
        subscription_status: "active", 
      })
      .eq("id", session.metadata.userId);
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Update expiration date on renewal
    // First, find user by subscription ID since metadata might be missing on invoice events
     /* 
       Note: Optimally, we query profile by stripe_subscription_id.
       For now, we rely on checkout completion for initial setup.
       Recurring updates require profile lookup by stripe_subscription_id.
     */
     const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_subscription_id', subscription.id).single();
     
     if(profile) {
        await supabase.from('profiles').update({
            stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }).eq('id', profile.id);
     }
  }

  if (event.type === "customer.subscription.deleted") {
      // Downgrade user
      const subscription = event.data.object as Stripe.Subscription;
      const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_subscription_id', subscription.id).single();

      if(profile) {
          await supabase.from('profiles').update({
              plan_tier: 'FREE',
              subscription_status: 'canceled',
              stripe_current_period_end: null
          }).eq('id', profile.id);
      }
  }

  return new NextResponse(null, { status: 200 });
}
