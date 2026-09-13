import Stripe from "stripe";

const stripeApiKey = process.env.STRIPE_SECRET_KEY || "sk_test_mock_key";

export const stripe = new Stripe(stripeApiKey, {
  apiVersion: "2025-01-27.acacia" as any,
  typescript: true,
});

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  isMock: boolean;
}

export async function createOrMockPaymentIntent(params: {
  amountCents: number;
  currency?: string;
  bookingId: string;
  bookingReference: string;
  customerEmail: string;
  idempotencyKey: string;
}): Promise<PaymentIntentResult> {
  // If a valid live/test Stripe key is provided, use Stripe API
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") && process.env.STRIPE_SECRET_KEY !== "sk_test_mock_secret_key") {
    try {
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: params.amountCents,
          currency: params.currency || "usd",
          description: `CineBook Tickets [${params.bookingReference}]`,
          receipt_email: params.customerEmail,
          metadata: {
            bookingId: params.bookingId,
            bookingReference: params.bookingReference,
          },
          automatic_payment_methods: {
            enabled: true,
          },
        },
        {
          idempotencyKey: params.idempotencyKey,
        }
      );

      return {
        clientSecret: paymentIntent.client_secret || "",
        paymentIntentId: paymentIntent.id,
        isMock: false,
      };
    } catch (err) {
      console.warn("Stripe API failed or invalid key, falling back to embedded test gateway:", err);
    }
  }

  // Self-contained embedded test mode payment intent
  const mockIntentId = `pi_mock_${params.bookingReference}_${Date.now()}`;
  return {
    clientSecret: `${mockIntentId}_secret_test`,
    paymentIntentId: mockIntentId,
    isMock: true,
  };
}
