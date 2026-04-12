import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Environment, Paddle, LogLevel } from "@paddle/paddle-node-sdk";

const PRICE_IDS: Record<string, string | undefined> = {
  student: process.env.PADDLE_PRICE_STUDENT_MONTHLY,
  pro:     process.env.PADDLE_PRICE_PRO_MONTHLY     || process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY,
  teams:   process.env.PADDLE_PRICE_TEAMS_MONTHLY   || process.env.NEXT_PUBLIC_PADDLE_PRICE_TEAMS_MONTHLY,
};

/**
 * POST /api/paddle/checkout-url
 * Body: { plan: "student" | "pro" | "teams", discountCode?: string }
 * Returns: { url: string }
 *
 * Creates a Paddle hosted-page transaction and returns the checkout URL.
 * This bypasses Paddle.js SDK entirely — always works.
 */
export async function POST(req: NextRequest) {
  // Auth: must be signed in
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { plan, discountCode } = await req.json() as { plan: string; discountCode?: string };
  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    console.error(`[checkout-url] No price ID for plan=${plan}. Env vars:`, Object.keys(process.env).filter(k => k.includes("PADDLE_PRICE")));
    return NextResponse.json({ error: `Price not configured for plan: ${plan}` }, { status: 422 });
  }

  const paddle = new Paddle(process.env.PADDLE_API_SECRET_KEY || process.env.PADDLE_API_KEY || "", {
    environment: process.env.PADDLE_ENVIRONMENT === "production" ? Environment.production : Environment.sandbox,
    logLevel: LogLevel.error,
  });

  try {
    // Fetch user profile for email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, phone")
      .eq("id", user.id)
      .single();
    const email = profile?.email || user.email || "";

    const txBody: Record<string, unknown> = {
      items: [{ priceId, quantity: 1 }],
      checkoutSettings: {
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://thakirni.com"}/vault/settings?checkout=success&plan=${plan}`,
      },
    };

    if (email) {
      (txBody as any).customer = { email };
    }

    if (discountCode) {
      (txBody as any).discountCode = discountCode;
    }

    const transaction = await (paddle.transactions as any).create(txBody);
    const checkoutUrl = (transaction as any)?.checkout?.url;

    if (!checkoutUrl) {
      console.error("[checkout-url] No checkout URL in response:", JSON.stringify(transaction).slice(0, 400));
      return NextResponse.json({ error: "Paddle did not return a checkout URL" }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (err: any) {
    console.error("[checkout-url] Paddle error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Paddle checkout failed" }, { status: 500 });
  }
}
