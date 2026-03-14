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
    const transaction = await paddleClient.transactions.retrieve(transactionId);
    return transaction as PaddleTransaction;
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
    const subscription = await paddleClient.subscriptions.retrieve(subscriptionId);
    return subscription as PaddleSubscription;
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
    const subscriptions = await paddleClient.subscriptions.list({
      query: {
        customerId,
      },
    });
    return (subscriptions?.data || []) as PaddleSubscription[];
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
    await paddleClient.subscriptions.update(subscriptionId, {
      cancelledAt: effectiveFrom === "immediately" ? new Date().toISOString() : undefined,
      status: "cancelled",
    });
    return true;
  } catch (error) {
    console.error("[Paddle] Error cancelling subscription:", error);
    return false;
  }
}

/**
 * Get the Paddle SDK client
 */
export function getPaddleClient() {
  return paddleClient;
}
