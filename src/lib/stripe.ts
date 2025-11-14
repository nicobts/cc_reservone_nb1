import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
})

/**
 * Create a payment intent for a reservation deposit
 */
export async function createPaymentIntent({
  amount,
  currency = "usd",
  metadata,
}: {
  amount: number
  currency?: string
  metadata: {
    reservationId: string
    restaurantId: string
    guestEmail: string
    guestName: string
  }
}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  })

  return paymentIntent
}

/**
 * Create a Stripe Checkout session for reservation deposit
 */
export async function createCheckoutSession({
  amount,
  currency = "usd",
  successUrl,
  cancelUrl,
  metadata,
}: {
  amount: number
  currency?: string
  successUrl: string
  cancelUrl: string
  metadata: {
    reservationId: string
    restaurantId: string
    guestEmail: string
    guestName: string
  }
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: "Reservation Deposit",
            description: `Deposit for reservation at restaurant`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    customer_email: metadata.guestEmail,
  })

  return session
}

/**
 * Refund a payment
 */
export async function refundPayment({
  paymentIntentId,
  amount,
  reason = "requested_by_customer",
}: {
  paymentIntentId: string
  amount?: number
  reason?: string
}) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason: reason as Stripe.RefundCreateParams.Reason,
  })

  return refund
}

/**
 * Retrieve a payment intent
 */
export async function getPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  return paymentIntent
}

/**
 * Retrieve a checkout session
 */
export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  return session
}

/**
 * Calculate deposit amount based on party size and restaurant settings
 */
export function calculateDepositAmount(
  partySize: number,
  settings: {
    requireDeposit: boolean
    depositAmount: number | null
    depositPercentage: number | null
    depositThreshold: number | null
  }
): number {
  if (!settings.requireDeposit) {
    return 0
  }

  // Check if party size meets threshold
  if (settings.depositThreshold && partySize < settings.depositThreshold) {
    return 0
  }

  // Return fixed deposit amount or percentage-based
  if (settings.depositAmount) {
    return settings.depositAmount
  }

  // For percentage-based deposits, we'd need the total bill amount
  // For now, return a default deposit
  return 2000 // $20 default deposit in cents
}
