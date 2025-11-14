import { z } from "zod"
import { eq, and, gte, lte, desc, sql } from "drizzle-orm"
import { ORPCError, oc } from "orpc"
import { publicProcedure, protectedProcedure, staffProcedure } from "../router"
import { reservations, restaurants, tables, operatingHours } from "@/db/schema"
import { createReservationSchema, updateReservationStatusSchema } from "@/types"
import {
  sendReservationConfirmation,
  sendReservationCancellation,
  sendReservationStatusUpdate,
} from "@/lib/email"

export const reservationRouter = oc
  .tag("Reservation")
  .route({
    // Public: Check availability
    checkAvailability: publicProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          date: z.date(),
          time: z.string(), // HH:MM format
          partySize: z.number().min(1).max(20),
        })
      )
      .output(
        z.object({
          available: z.boolean(),
          availableSlots: z.array(z.string()),
          message: z.string().optional(),
        })
      )
      .func(async ({ input, context }) => {
        const { restaurantId, date, time, partySize } = input

        // Get restaurant
        const restaurant = await context.db.query.restaurants.findFirst({
          where: eq(restaurants.id, restaurantId),
        })

        if (!restaurant) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found",
          })
        }

        // Check if restaurant is open on this day
        const dayOfWeek = date.getDay()
        const hours = await context.db.query.operatingHours.findFirst({
          where: and(
            eq(operatingHours.restaurantId, restaurantId),
            eq(operatingHours.dayOfWeek, dayOfWeek)
          ),
        })

        if (!hours || hours.isClosed) {
          return {
            available: false,
            availableSlots: [],
            message: "Restaurant is closed on this day",
          }
        }

        // Check if requested time is within operating hours
        const [requestHour, requestMinute] = time.split(":").map(Number)
        const [openHour, openMinute] = hours.openTime.split(":").map(Number)
        const [closeHour, closeMinute] = hours.closeTime.split(":").map(Number)

        const requestTimeMinutes = requestHour * 60 + requestMinute
        const openTimeMinutes = openHour * 60 + openMinute
        const closeTimeMinutes = closeHour * 60 + closeMinute

        if (requestTimeMinutes < openTimeMinutes || requestTimeMinutes > closeTimeMinutes - 120) {
          // Must book at least 2 hours before closing
          return {
            available: false,
            availableSlots: [],
            message: `Restaurant is open from ${hours.openTime} to ${hours.closeTime}`,
          }
        }

        // Get all active tables that can accommodate the party
        const availableTables = await context.db.query.tables.findMany({
          where: and(
            eq(tables.restaurantId, restaurantId),
            eq(tables.isActive, true),
            gte(tables.maxCapacity, partySize),
            lte(tables.minCapacity, partySize)
          ),
        })

        if (availableTables.length === 0) {
          return {
            available: false,
            availableSlots: [],
            message: `No tables available for party of ${partySize}`,
          }
        }

        // Check existing reservations for this time slot (2-hour window)
        const requestedDateTime = new Date(date)
        requestedDateTime.setHours(requestHour, requestMinute, 0, 0)

        const twoHoursBefore = new Date(requestedDateTime.getTime() - 2 * 60 * 60 * 1000)
        const twoHoursAfter = new Date(requestedDateTime.getTime() + 2 * 60 * 60 * 1000)

        const conflictingReservations = await context.db.query.reservations.findMany({
          where: and(
            eq(reservations.restaurantId, restaurantId),
            gte(reservations.reservationDate, twoHoursBefore),
            lte(reservations.reservationDate, twoHoursAfter),
            sql`${reservations.status} IN ('pending', 'confirmed', 'seated')`
          ),
        })

        // Count how many tables are occupied
        const occupiedTableIds = new Set(
          conflictingReservations.map((r) => r.tableId).filter(Boolean)
        )

        const availableTableCount = availableTables.filter(
          (t) => !occupiedTableIds.has(t.id)
        ).length

        if (availableTableCount === 0) {
          // Generate alternative time slots
          const alternativeSlots: string[] = []
          for (let offset = -60; offset <= 60; offset += 15) {
            if (offset === 0) continue
            const altMinutes = requestTimeMinutes + offset
            if (altMinutes >= openTimeMinutes && altMinutes <= closeTimeMinutes - 120) {
              const altHour = Math.floor(altMinutes / 60)
              const altMin = altMinutes % 60
              alternativeSlots.push(
                `${altHour.toString().padStart(2, "0")}:${altMin.toString().padStart(2, "0")}`
              )
            }
          }

          return {
            available: false,
            availableSlots: alternativeSlots.slice(0, 6),
            message: "No tables available at this time. Here are some alternative times:",
          }
        }

        return {
          available: true,
          availableSlots: [time],
          message: `${availableTableCount} table(s) available for your party`,
        }
      }),

    // Public: Get available time slots for a date
    getAvailableSlots: publicProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          date: z.date(),
          partySize: z.number().min(1).max(20),
        })
      )
      .output(z.array(z.string()))
      .func(async ({ input, context }) => {
        const { restaurantId, date, partySize } = input

        // Check if restaurant is open on this day
        const dayOfWeek = date.getDay()
        const hours = await context.db.query.operatingHours.findFirst({
          where: and(
            eq(operatingHours.restaurantId, restaurantId),
            eq(operatingHours.dayOfWeek, dayOfWeek)
          ),
        })

        if (!hours || hours.isClosed) {
          return []
        }

        // Get all active tables that can accommodate the party
        const availableTables = await context.db.query.tables.findMany({
          where: and(
            eq(tables.restaurantId, restaurantId),
            eq(tables.isActive, true),
            gte(tables.maxCapacity, partySize),
            lte(tables.minCapacity, partySize)
          ),
        })

        if (availableTables.length === 0) {
          return []
        }

        // Get all reservations for this date
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const dayReservations = await context.db.query.reservations.findMany({
          where: and(
            eq(reservations.restaurantId, restaurantId),
            gte(reservations.reservationDate, startOfDay),
            lte(reservations.reservationDate, endOfDay),
            sql`${reservations.status} IN ('pending', 'confirmed', 'seated')`
          ),
        })

        // Generate all possible time slots
        const [openHour, openMinute] = hours.openTime.split(":").map(Number)
        const [closeHour, closeMinute] = hours.closeTime.split(":").map(Number)
        const openTimeMinutes = openHour * 60 + openMinute
        const closeTimeMinutes = closeHour * 60 + closeMinute

        const possibleSlots: string[] = []
        for (let minutes = openTimeMinutes; minutes <= closeTimeMinutes - 120; minutes += 15) {
          const hour = Math.floor(minutes / 60)
          const minute = minutes % 60
          possibleSlots.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`)
        }

        // Filter out slots that don't have available tables
        const availableSlots: string[] = []

        for (const timeSlot of possibleSlots) {
          const [slotHour, slotMinute] = timeSlot.split(":").map(Number)
          const slotDateTime = new Date(date)
          slotDateTime.setHours(slotHour, slotMinute, 0, 0)

          const twoHoursBefore = new Date(slotDateTime.getTime() - 2 * 60 * 60 * 1000)
          const twoHoursAfter = new Date(slotDateTime.getTime() + 2 * 60 * 60 * 1000)

          // Check if any tables are available for this slot
          const conflictingReservations = dayReservations.filter((r) => {
            const resDate = new Date(r.reservationDate)
            return resDate >= twoHoursBefore && resDate <= twoHoursAfter
          })

          const occupiedTableIds = new Set(
            conflictingReservations.map((r) => r.tableId).filter(Boolean)
          )

          const availableTableCount = availableTables.filter(
            (t) => !occupiedTableIds.has(t.id)
          ).length

          if (availableTableCount > 0) {
            availableSlots.push(timeSlot)
          }
        }

        return availableSlots
      }),

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

        // Find best available table for this reservation
        const availableTables = await context.db.query.tables.findMany({
          where: and(
            eq(tables.restaurantId, input.restaurantId),
            eq(tables.isActive, true),
            gte(tables.maxCapacity, input.partySize),
            lte(tables.minCapacity, input.partySize)
          ),
          orderBy: [tables.minCapacity], // Prefer smallest table that fits
        })

        let assignedTableId: string | null = null

        if (availableTables.length > 0) {
          // Check which tables are available at the requested time
          const twoHoursBefore = new Date(input.reservationDate.getTime() - 2 * 60 * 60 * 1000)
          const twoHoursAfter = new Date(input.reservationDate.getTime() + 2 * 60 * 60 * 1000)

          const conflictingReservations = await context.db.query.reservations.findMany({
            where: and(
              eq(reservations.restaurantId, input.restaurantId),
              gte(reservations.reservationDate, twoHoursBefore),
              lte(reservations.reservationDate, twoHoursAfter),
              sql`${reservations.status} IN ('pending', 'confirmed', 'seated')`
            ),
          })

          const occupiedTableIds = new Set(
            conflictingReservations.map((r) => r.tableId).filter(Boolean)
          )

          // Find first available table
          const availableTable = availableTables.find((t) => !occupiedTableIds.has(t.id))

          if (availableTable) {
            assignedTableId = availableTable.id
          }
        }

        // Create reservation
        const [newReservation] = await context.db
          .insert(reservations)
          .values({
            ...input,
            userId: context.user?.id,
            tableId: assignedTableId,
            confirmationToken: crypto.randomUUID(),
            status: "pending",
          })
          .returning()

        // Send confirmation email (async, don't wait)
        sendReservationConfirmation({
          guestEmail: newReservation.guestEmail,
          guestName: newReservation.guestName,
          restaurantName: restaurant.name,
          reservationDate: newReservation.reservationDate,
          partySize: newReservation.partySize,
          confirmationToken: newReservation.confirmationToken,
          specialRequests: newReservation.specialRequests ?? undefined,
        }).catch((error) => {
          console.error("Failed to send confirmation email:", error)
          // Don't fail the reservation if email fails
        })

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

        // Get reservation with restaurant details before updating
        const reservation = await context.db.query.reservations.findFirst({
          where: eq(reservations.id, input.id),
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

        // Send notification email for significant status changes
        if (input.data.status === "confirmed") {
          sendReservationStatusUpdate({
            guestEmail: reservation.guestEmail,
            guestName: reservation.guestName,
            restaurantName: reservation.restaurant.name,
            reservationDate: reservation.reservationDate,
            status: "confirmed",
            message:
              "Great news! Your reservation has been confirmed. We look forward to seeing you!",
          }).catch((error) => {
            console.error("Failed to send status update email:", error)
          })
        }

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
          with: {
            restaurant: true,
          },
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

        // Send cancellation email
        sendReservationCancellation({
          guestEmail: reservation.guestEmail,
          guestName: reservation.guestName,
          restaurantName: reservation.restaurant.name,
          reservationDate: reservation.reservationDate,
          partySize: reservation.partySize,
          reason: input.reason,
        }).catch((error) => {
          console.error("Failed to send cancellation email:", error)
        })

        return { success: true }
      }),
  })
