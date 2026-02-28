/**
 * Stripe payment client — server-side only.
 *
 * Creates Payment Intents, verifies webhook signatures,
 * and retrieves payment status.
 *
 * Configuration via environment variables:
 *  - STRIPE_SECRET_KEY: Server-side secret key
 *  - STRIPE_WEBHOOK_SECRET: Webhook endpoint signing secret
 */

import Stripe from 'stripe';

const getStripeKey = (): string => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is required');
  return key;
};

let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(getStripeKey(), {
      apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
    });
  }
  return stripeInstance;
};

export const getWebhookSecret = (): string => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
  return secret;
};

export interface CreatePaymentIntentParams {
  amountInCents: number;
  currency?: string;
  metadata: Record<string, string>;
}

/** Create a Stripe PaymentIntent and return its client secret. */
export const createPaymentIntent = async (
  params: CreatePaymentIntentParams
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: params.amountInCents,
    currency: params.currency ?? 'inr',
    metadata: params.metadata,
    payment_method_types: ['card'],
  });

  if (!intent.client_secret) {
    throw new Error('Stripe did not return a client secret');
  }

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
};

/** Verify a webhook event signature and parse the event. */
export const constructWebhookEvent = (
  rawBody: Buffer,
  signature: string,
): Stripe.Event => {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, getWebhookSecret());
};

/** Retrieve a PaymentIntent to check its status. */
export const retrievePaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  const stripe = getStripe();
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};
