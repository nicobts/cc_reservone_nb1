import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { ORPCError, oc } from "orpc"
import { ownerProcedure, staffProcedure } from "../router"
import { operatingHours, restaurants } from "@/db/schema"
import { verifyRestaurantAccess, verifyRestaurantOwnership } from "../permissions"

export const operatingHoursRouter = oc
  .tag("OperatingHours")
  .route({
    // Get operating hours for a restaurant
    getRestaurantHours: staffProcedure
      .input(z.object({ restaurantId: z.string().uuid() }))
      .output(z.any())
      .func(async ({ input, context }) => {
        // Verify access to restaurant
        await verifyRestaurantAccess(context.db, input.restaurantId, context.user.id)

        const hours = await context.db.query.operatingHours.findMany({
          where: eq(operatingHours.restaurantId, input.restaurantId),
          orderBy: [operatingHours.dayOfWeek],
        })

        // Ensure we have all 7 days (0-6)
        const allDays = Array.from({ length: 7 }, (_, i) => i)
        const existingDays = new Set(hours.map((h) => h.dayOfWeek))

        const completeHours = allDays.map((day) => {
          const existing = hours.find((h) => h.dayOfWeek === day)
          if (existing) return existing

          // Default hours if not set
          return {
            id: null,
            restaurantId: input.restaurantId,
            dayOfWeek: day,
            openTime: "11:00",
            closeTime: "22:00",
            isClosed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        })

        return completeHours
      }),

    // Update operating hours for a restaurant
    updateHours: ownerProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          hours: z.array(
            z.object({
              dayOfWeek: z.number().min(0).max(6),
              openTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
              closeTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
              isClosed: z.boolean(),
            })
          ),
        })
      )
      .output(z.object({ success: z.boolean() }))
      .func(async ({ input, context }) => {
        // Verify restaurant exists and user owns it
        const restaurant = await context.db.query.restaurants.findFirst({
          where: eq(restaurants.id, input.restaurantId),
        })

        if (!restaurant) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found",
          })
        }

        if (restaurant.ownerId !== context.user.id) {
          throw new ORPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to update this restaurant",
          })
        }

        // Get existing hours
        const existingHours = await context.db.query.operatingHours.findMany({
          where: eq(operatingHours.restaurantId, input.restaurantId),
        })

        // Update or insert each day
        for (const dayHours of input.hours) {
          const existing = existingHours.find((h) => h.dayOfWeek === dayHours.dayOfWeek)

          if (existing) {
            // Update existing
            await context.db
              .update(operatingHours)
              .set({
                openTime: dayHours.openTime,
                closeTime: dayHours.closeTime,
                isClosed: dayHours.isClosed,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(operatingHours.restaurantId, input.restaurantId),
                  eq(operatingHours.dayOfWeek, dayHours.dayOfWeek)
                )
              )
          } else {
            // Insert new
            await context.db.insert(operatingHours).values({
              restaurantId: input.restaurantId,
              dayOfWeek: dayHours.dayOfWeek,
              openTime: dayHours.openTime,
              closeTime: dayHours.closeTime,
              isClosed: dayHours.isClosed,
            })
          }
        }

        return { success: true }
      }),

    // Bulk update - set same hours for multiple days
    bulkUpdate: ownerProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          days: z.array(z.number().min(0).max(6)),
          openTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
          closeTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
          isClosed: z.boolean(),
        })
      )
      .output(z.object({ success: z.boolean() }))
      .func(async ({ input, context }) => {
        // Verify restaurant ownership
        const restaurant = await context.db.query.restaurants.findFirst({
          where: eq(restaurants.id, input.restaurantId),
        })

        if (!restaurant) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found",
          })
        }

        if (restaurant.ownerId !== context.user.id) {
          throw new ORPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to update this restaurant",
          })
        }

        // Get existing hours
        const existingHours = await context.db.query.operatingHours.findMany({
          where: eq(operatingHours.restaurantId, input.restaurantId),
        })

        // Update each selected day
        for (const day of input.days) {
          const existing = existingHours.find((h) => h.dayOfWeek === day)

          if (existing) {
            await context.db
              .update(operatingHours)
              .set({
                openTime: input.openTime,
                closeTime: input.closeTime,
                isClosed: input.isClosed,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(operatingHours.restaurantId, input.restaurantId),
                  eq(operatingHours.dayOfWeek, day)
                )
              )
          } else {
            await context.db.insert(operatingHours).values({
              restaurantId: input.restaurantId,
              dayOfWeek: day,
              openTime: input.openTime,
              closeTime: input.closeTime,
              isClosed: input.isClosed,
            })
          }
        }

        return { success: true }
      }),
  })
