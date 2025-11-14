import { z } from "zod"
import { eq, and, gte, lte, desc } from "drizzle-orm"
import { ORPCError, oc } from "orpc"
import { publicProcedure, protectedProcedure, staffProcedure } from "../router"
import { reservations, restaurants } from "@/db/schema"
import { createReservationSchema, updateReservationStatusSchema } from "@/types"

export const reservationRouter = oc
  .tag("Reservation")
  .route({
    // Public: Create reservation
    create: publicProcedure
      .input(createReservationSchema)
      .output(z.any())
      .func(async ({ input, context }) => {
        // Verify restaurant exists
        const restaurant = await context.db.query.restaurants.findFirst({
          where: eq(restaurants.id, input.restaurantId),
        })

        if (!restaurant) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found",
          })
        }

        // Create reservation
        const [newReservation] = await context.db
          .insert(reservations)
          .values({
            ...input,
            userId: context.user?.id,
            confirmationToken: crypto.randomUUID(),
            status: "pending",
          })
          .returning()

        // TODO: Send confirmation email

        return newReservation
      }),

    // Protected: Get my reservations
    getMyReservations: protectedProcedure
      .input(
        z
          .object({
            status: z
              .enum(["pending", "confirmed", "seated", "completed", "cancelled", "no_show"])
              .optional(),
          })
          .optional()
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        const userReservations = await context.db.query.reservations.findMany({
          where: input?.status
            ? and(eq(reservations.userId, context.user.id), eq(reservations.status, input.status))
            : eq(reservations.userId, context.user.id),
          orderBy: [desc(reservations.reservationDate)],
          with: {
            restaurant: true,
          },
        })

        return userReservations
      }),

    // Staff: Get restaurant reservations
    getRestaurantReservations: staffProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          date: z.date().optional(),
          status: z
            .enum(["pending", "confirmed", "seated", "completed", "cancelled", "no_show"])
            .optional(),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        // TODO: Verify user has access to this restaurant

        let conditions = [eq(reservations.restaurantId, input.restaurantId)]

        if (input.status) {
          conditions.push(eq(reservations.status, input.status))
        }

        if (input.date) {
          const startOfDay = new Date(input.date)
          startOfDay.setHours(0, 0, 0, 0)
          const endOfDay = new Date(input.date)
          endOfDay.setHours(23, 59, 59, 999)

          conditions.push(gte(reservations.reservationDate, startOfDay))
          conditions.push(lte(reservations.reservationDate, endOfDay))
        }

        const restaurantReservations = await context.db.query.reservations.findMany({
          where: and(...conditions),
          orderBy: [desc(reservations.reservationDate)],
          with: {
            table: true,
          },
        })

        return restaurantReservations
      }),

    // Staff: Update reservation status
    updateStatus: staffProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          data: updateReservationStatusSchema,
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        // TODO: Verify user has access to this reservation's restaurant

        const [updated] = await context.db
          .update(reservations)
          .set({
            status: input.data.status,
            internalNotes: input.data.internalNotes,
            updatedAt: new Date(),
            ...(input.data.status === "confirmed" && { confirmedAt: new Date() }),
            ...(input.data.status === "seated" && { checkedInAt: new Date() }),
            ...(input.data.status === "completed" && { checkedOutAt: new Date() }),
            ...(input.data.status === "cancelled" && { cancelledAt: new Date() }),
          })
          .where(eq(reservations.id, input.id))
          .returning()

        // TODO: Send notification to guest

        return updated
      }),

    // Public: Cancel reservation
    cancel: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          confirmationToken: z.string(),
          reason: z.string().optional(),
        })
      )
      .output(z.object({ success: z.boolean() }))
      .func(async ({ input, context }) => {
        const reservation = await context.db.query.reservations.findFirst({
          where: and(
            eq(reservations.id, input.id),
            eq(reservations.confirmationToken, input.confirmationToken)
          ),
        })

        if (!reservation) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Reservation not found or invalid confirmation token",
          })
        }

        if (reservation.status === "cancelled") {
          throw new ORPCError({
            code: "BAD_REQUEST",
            message: "Reservation is already cancelled",
          })
        }

        await context.db
          .update(reservations)
          .set({
            status: "cancelled",
            cancelledAt: new Date(),
            cancellationReason: input.reason,
            updatedAt: new Date(),
          })
          .where(eq(reservations.id, input.id))

        // TODO: Send cancellation email

        return { success: true }
      }),
  })
