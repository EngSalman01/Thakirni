import { Environment, Paddle, LogLevel } from "@paddle/paddle-node-sdk";

const paddleClient = new Paddle(process.env.PADDLE_API_SECRET_KEY || "", {
  environment: process.env.PADDLE_ENVIRONMENT === "production"
    ? Environment.production
    : Environment.sandbox,
  logLevel: LogLevel.error,
});

export interface PaddleTransaction {
  id: string;
  customerId?: string;
  subscriptionId?: string;
  status: string;
  totalPrice?: {
    amount: string;
    currencyCode: string;
  };
  billingDetails?: {
    enableCheckout: boolean;
    purchaseOrderNumber?: string;
  };
}

export interface PaddleSubscription {
  id: string;
  customerId: string;
  priceId: string;
  status: string;
  currentBillingPeriod?: {
    startsAt: string;
    endsAt: string;
  };
  nextBilledAt?: string;
  pausedAt?: string;
  cancelledAt?: string;
}

/**
 * Verify a Paddle transaction by ID
 */
export async function verifyPaddleTransaction(
  transactionId: string
): Promise<PaddleTransaction | null> {
  try {
    const transaction = await paddleClient.transactions.get(transactionId);
    return transaction as unknown as PaddleTransaction;
  } catch (error) {
    console.error("[Paddle] Error verifying transaction:", error);
    return null;
  }
}

/**
 * Get subscription details from Paddle
 */
export async function getPaddleSubscription(
  subscriptionId: string
): Promise<PaddleSubscription | null> {
  try {
    const subscription = await paddleClient.subscriptions.get(subscriptionId);
    return subscription as unknown as PaddleSubscription;
  } catch (error) {
    console.error("[Paddle] Error retrieving subscription:", error);
    return null;
  }
}

/**
 * Get customer subscriptions from Paddle
 */
export async function getCustomerSubscriptions(
  customerId: string
): Promise<PaddleSubscription[]> {
  try {
    const collection = paddleClient.subscriptions.list({
      customerId: [customerId],
    });
    const results: PaddleSubscription[] = [];
    for await (const item of collection) {
      results.push(item as unknown as PaddleSubscription);
    }
    return results;
  } catch (error) {
    console.error("[Paddle] Error retrieving customer subscriptions:", error);
    return [];
  }
}

/**
 * Cancel a subscription in Paddle
 */
export async function cancelPaddleSubscription(
  subscriptionId: string,
  effectiveFrom?: "immediately" | "next_billing_period"
): Promise<boolean> {
  try {
    await paddleClient.subscriptions.cancel(subscriptionId, {
      effectiveFrom: effectiveFrom ?? "next_billing_period",
    });
    return true;
  } catch (error) {
    console.error("[Paddle] Error cancelling subscription:", error);
    return false;
  }
}

/**
 * Create a new recurring price on a Paddle product.
 * Returns the new Paddle price ID (pri_xxxx) or null on failure.
 */
export async function createPaddlePrice(
  productId: string,
  amountSar: number,
  description: string,
  billingCycle: { frequency: number; interval: "month" | "year" } = { frequency: 1, interval: "month" }
): Promise<{ priceId: string } | { error: string }> {
  try {
    const price = await paddleClient.prices.create({
      productId,
      description,
      unitPrice: {
        amount: Math.round(amountSar * 100).toString(),
        currencyCode: "USD",
      },
      billingCycle,
      taxMode: "account_setting",
    });
    return { priceId: (price as unknown as { id: string }).id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Paddle] Error creating price:", msg);
    return { error: msg };
  }
}

/**
 * Update the unit price of a Paddle price object.
 * Amount is in SAR (e.g., 30 → "3000" halalas).
 */
export async function updatePaddlePrice(
  priceId: string,
  amountSar: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await paddleClient.prices.update(priceId, {
      unitPrice: {
        amount: Math.round(amountSar * 100).toString(),
        currencyCode: "USD",
      },
    });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Paddle] Error updating price:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Get the Paddle SDK client
 */
export function getPaddleClient() {
  return paddleClient;
}
