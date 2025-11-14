import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/db"
import { payments, reservations } from "@/db/schema"
import { eq } from "drizzle-orm"
import type Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`)

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (!session.metadata?.reservationId) {
          console.error("No reservationId in session metadata")
          break
        }

        // Update payment status
        await db
          .update(payments)
          .set({
            status: session.payment_status === "paid" ? "succeeded" : "pending",
            stripeChargeId: session.payment_intent as string,
            updatedAt: new Date(),
          })
          .where(eq(payments.reservationId, session.metadata.reservationId))

        // Update reservation status if payment succeeded
        if (session.payment_status === "paid") {
          await db
            .update(reservations)
            .set({
              status: "confirmed",
              updatedAt: new Date(),
            })
            .where(eq(reservations.id, session.metadata.reservationId))
        }

        console.log(`[Stripe Webhook] Checkout session completed for reservation ${session.metadata.reservationId}`)
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Find payment by payment intent ID
        const payment = await db.query.payments.findFirst({
          where: eq(payments.stripePaymentIntentId, paymentIntent.id),
        })

        if (payment) {
          await db
            .update(payments)
            .set({
              status: "succeeded",
              updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id))

          // Update reservation status
          await db
            .update(reservations)
            .set({
              status: "confirmed",
              updatedAt: new Date(),
            })
            .where(eq(reservations.id, payment.reservationId))

          console.log(`[Stripe Webhook] Payment succeeded for reservation ${payment.reservationId}`)
        }
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        const payment = await db.query.payments.findFirst({
          where: eq(payments.stripePaymentIntentId, paymentIntent.id),
        })

        if (payment) {
          await db
            .update(payments)
            .set({
              status: "failed",
              errorMessage: paymentIntent.last_payment_error?.message,
              updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id))

          console.log(`[Stripe Webhook] Payment failed for reservation ${payment.reservationId}`)
        }
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge

        // Find payment by charge ID
        const payment = await db.query.payments.findFirst({
          where: eq(payments.stripeChargeId, charge.id),
        })

        if (payment) {
          await db
            .update(payments)
            .set({
              status: "refunded",
              refundedAmount: charge.amount_refunded,
              refundedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id))

          console.log(`[Stripe Webhook] Charge refunded for reservation ${payment.reservationId}`)
        }
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Stripe Webhook] Error processing webhook:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

// GET endpoint for webhook status check
export async function GET() {
  return NextResponse.json({
    status: "ready",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? "configured" : "not configured",
    endpoint: "/api/webhooks/stripe",
    method: "POST",
  })
}
