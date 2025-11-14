import { z } from "zod"
import { eq } from "drizzle-orm"
import { ORPCError, oc } from "@orpc/server"
import { ownerProcedure, staffProcedure } from "../router"
import { restaurantSettings, restaurants } from "@/db/schema"
import { verifyRestaurantAccess } from "../permissions"

const updateSettingsSchema = z.object({
  // Reservation settings
  advanceBookingDays: z.number().min(1).max(365).optional(),
  minAdvanceBookingHours: z.number().min(0).max(168).optional(),
  maxPartySize: z.number().min(1).max(100).optional(),
  defaultReservationDuration: z.number().min(30).max(480).optional(),
  slotInterval: z.number().min(5).max(60).optional(),

  // Deposit settings
  requireDepositForPartySize: z.number().min(1).nullable().optional(),
  depositAmount: z.number().min(0).nullable().optional(),
  depositPercentage: z.number().min(0).max(100).nullable().optional(),

  // Cancellation policy
  cancellationPolicy: z.string().nullable().optional(),
  allowCancellation: z.boolean().optional(),
  cancellationDeadlineHours: z.number().min(0).max(168).nullable().optional(),

  // Auto-confirmation
  autoConfirmReservations: z.boolean().optional(),

  // Reminders
  sendReminderEmail: z.boolean().optional(),
  sendReminderSMS: z.boolean().optional(),
  reminderHoursBefore: z.number().min(1).max(168).optional(),

  // Table management
  allowTableSelection: z.boolean().optional(),
  autoAssignTables: z.boolean().optional(),

  // Waitlist
  enableWaitlist: z.boolean().optional(),
  waitlistAutoExpireMinutes: z.number().min(5).max(120).nullable().optional(),

  // AI/Chatbot settings (Phase 2)
  enableAIChatbot: z.boolean().optional(),
  enableWhatsApp: z.boolean().optional(),
  enableTelegram: z.boolean().optional(),
  chatbotGreeting: z.string().nullable().optional(),
})

export const settingsRouter = oc
  .tag("Settings")
  .route({
    // Get restaurant settings
    getRestaurantSettings: staffProcedure
      .input(z.object({ restaurantId: z.string().uuid() }))
      .output(z.any())
      .func(async ({ input, context }) => {
        // Verify access to restaurant
        await verifyRestaurantAccess(context.db, input.restaurantId, context.user.id)

        const settings = await context.db.query.restaurantSettings.findFirst({
          where: eq(restaurantSettings.restaurantId, input.restaurantId),
        })

        // Return default settings if none exist
        if (!settings) {
          return {
            restaurantId: input.restaurantId,
            advanceBookingDays: 30,
            minAdvanceBookingHours: 2,
            maxPartySize: 12,
            defaultReservationDuration: 120,
            slotInterval: 15,
            requireDepositForPartySize: null,
            depositAmount: null,
            depositPercentage: null,
            cancellationPolicy: null,
            allowCancellation: true,
            cancellationDeadlineHours: 24,
            autoConfirmReservations: false,
            sendReminderEmail: true,
            sendReminderSMS: false,
            reminderHoursBefore: 24,
            allowTableSelection: false,
            autoAssignTables: true,
            enableWaitlist: false,
            waitlistAutoExpireMinutes: 15,
            enableAIChatbot: false,
            enableWhatsApp: false,
            enableTelegram: false,
            chatbotGreeting: null,
          }
        }

        return settings
      }),

    // Update restaurant settings
    updateSettings: ownerProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          settings: updateSettingsSchema,
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

        // Check if settings exist
        const existingSettings = await context.db.query.restaurantSettings.findFirst({
          where: eq(restaurantSettings.restaurantId, input.restaurantId),
        })

        if (existingSettings) {
          // Update existing settings
          await context.db
            .update(restaurantSettings)
            .set({
              ...input.settings,
              updatedAt: new Date(),
            })
            .where(eq(restaurantSettings.restaurantId, input.restaurantId))
        } else {
          // Create new settings
          await context.db.insert(restaurantSettings).values({
            restaurantId: input.restaurantId,
            ...input.settings,
          })
        }

        return { success: true }
      }),
  })
