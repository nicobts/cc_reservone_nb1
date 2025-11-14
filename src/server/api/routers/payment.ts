import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { ORPCError, oc } from "@orpc/server"
import { publicProcedure, protectedProcedure } from "../router"
import { payments, reservations, restaurantSettings } from "@/db/schema"
import {
  createCheckoutSession,
  refundPayment,
  getCheckoutSession,
  calculateDepositAmount,
} from "@/lib/stripe"

export const paymentRouter = oc
  .tag("Payment")
  .route({
    // Create checkout session for reservation deposit
    createCheckoutSession: publicProcedure
      .input(
        z.object({
          reservationId: z.string().uuid(),
        })
      )
      .output(
        z.object({
          sessionId: z.string(),
          url: z.string(),
        })
      )
      .func(async ({ input, context }) => {
        // Get reservation
        const reservation = await context.db.query.reservations.findFirst({
          where: eq(reservations.id, input.reservationId),
          with: {
            restaurant: true,
          },
        })

        if (!reservation) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Reservation not found",
          })
        }

        // Get restaurant settings
        const settings = await context.db.query.restaurantSettings.findFirst({
          where: eq(restaurantSettings.restaurantId, reservation.restaurantId),
        })

        if (!settings) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Restaurant settings not found",
          })
        }

        // Calculate deposit amount
        const depositAmount = calculateDepositAmount(reservation.partySize, {
          requireDeposit: settings.requireDeposit ?? false,
          depositAmount: settings.depositAmount,
          depositPercentage: settings.depositPercentage,
          depositThreshold: settings.depositThreshold,
        })

        if (depositAmount === 0) {
          throw new ORPCError({
            code: "BAD_REQUEST",
            message: "No deposit required for this reservation",
          })
        }

        // Check if payment already exists
        const existingPayment = await context.db.query.payments.findFirst({
          where: eq(payments.reservationId, input.reservationId),
        })

        if (existingPayment && existingPayment.status === "succeeded") {
          throw new ORPCError({
            code: "BAD_REQUEST",
            message: "Payment already completed for this reservation",
          })
        }

        // Create Stripe checkout session
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const session = await createCheckoutSession({
          amount: depositAmount,
          currency: "usd",
          successUrl: `${baseUrl}/book/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${baseUrl}/book/${reservation.restaurant.slug}?payment=cancelled`,
          metadata: {
            reservationId: reservation.id,
            restaurantId: reservation.restaurantId,
            guestEmail: reservation.guestEmail,
            guestName: reservation.guestName,
          },
        })

        // Create or update payment record
        if (existingPayment) {
          await context.db
            .update(payments)
            .set({
              status: "pending",
              amount: depositAmount,
              stripePaymentIntentId: session.payment_intent as string,
              updatedAt: new Date(),
            })
            .where(eq(payments.id, existingPayment.id))
        } else {
          await context.db.insert(payments).values({
            reservationId: reservation.id,
            restaurantId: reservation.restaurantId,
            amount: depositAmount,
            currency: "USD",
            stripePaymentIntentId: session.payment_intent as string,
            status: "pending",
            method: "card",
          })
        }

        return {
          sessionId: session.id,
          url: session.url!,
        }
      }),

    // Get payment status
    getPaymentStatus: publicProcedure
      .input(
        z.object({
          reservationId: z.string().uuid(),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        const payment = await context.db.query.payments.findFirst({
          where: eq(payments.reservationId, input.reservationId),
        })

        if (!payment) {
          return { exists: false }
        }

        return {
          exists: true,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          refundedAmount: payment.refundedAmount,
          refundedAt: payment.refundedAt,
        }
      }),

    // Verify checkout session
    verifyCheckoutSession: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
        })
      )
      .output(
        z.object({
          status: z.string(),
          reservationId: z.string().optional(),
        })
      )
      .func(async ({ input, context }) => {
        const session = await getCheckoutSession(input.sessionId)

        if (!session.metadata?.reservationId) {
          throw new ORPCError({
            code: "BAD_REQUEST",
            message: "Invalid session",
          })
        }

        // Update payment status based on session status
        const payment = await context.db.query.payments.findFirst({
          where: eq(payments.reservationId, session.metadata.reservationId),
        })

        if (payment && session.payment_status === "paid") {
          await context.db
            .update(payments)
            .set({
              status: "succeeded",
              stripeChargeId: session.payment_intent as string,
              updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id))

          // Update reservation status to confirmed if payment succeeded
          await context.db
            .update(reservations)
            .set({
              status: "confirmed",
              updatedAt: new Date(),
            })
            .where(eq(reservations.id, session.metadata.reservationId))
        }

        return {
          status: session.payment_status || "unknown",
          reservationId: session.metadata.reservationId,
        }
      }),

    // Refund payment (protected - user must own the reservation)
    refund: protectedProcedure
      .input(
        z.object({
          reservationId: z.string().uuid(),
          amount: z.number().optional(),
          reason: z.string().optional(),
        })
      )
      .output(
        z.object({
          success: z.boolean(),
          refundId: z.string().optional(),
        })
      )
      .func(async ({ input, context }) => {
        // Get reservation and verify ownership
        const reservation = await context.db.query.reservations.findFirst({
          where: eq(reservations.id, input.reservationId),
        })

        if (!reservation) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Reservation not found",
          })
        }

        // Only allow refund for user's own reservations or restaurant staff
        if (reservation.userId && reservation.userId !== context.user.id) {
          throw new ORPCError({
            code: "FORBIDDEN",
            message: "You can only refund your own reservations",
          })
        }

        // Get payment
        const payment = await context.db.query.payments.findFirst({
          where: and(
            eq(payments.reservationId, input.reservationId),
            eq(payments.status, "succeeded")
          ),
        })

        if (!payment) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "No successful payment found for this reservation",
          })
        }

        if (!payment.stripePaymentIntentId) {
          throw new ORPCError({
            code: "BAD_REQUEST",
            message: "Payment intent ID not found",
          })
        }

        // Process refund through Stripe
        const refund = await refundPayment({
          paymentIntentId: payment.stripePaymentIntentId,
          amount: input.amount,
          reason: input.reason || "requested_by_customer",
        })

        // Update payment record
        await context.db
          .update(payments)
          .set({
            status: "refunded",
            refundedAmount: refund.amount,
            refundedAt: new Date(),
            refundReason: input.reason,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id))

        return {
          success: true,
          refundId: refund.id,
        }
      }),

    // Get my payments (for customer dashboard)
    getMyPayments: protectedProcedure.output(z.any()).func(async ({ context }) => {
      const userReservations = await context.db.query.reservations.findMany({
        where: eq(reservations.userId, context.user.id),
      })

      const reservationIds = userReservations.map((r) => r.id)

      const userPayments = await context.db.query.payments.findMany({
        where: eq(payments.reservationId, reservationIds[0]),
        with: {
          reservation: {
            with: {
              restaurant: true,
            },
          },
        },
      })

      return userPayments
    }),
  })
