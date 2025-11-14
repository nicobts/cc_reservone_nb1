import { db } from "@/db"
import { reservations, restaurants, restaurantSettings } from "@/db/schema"
import { and, gte, lte, eq } from "drizzle-orm"
import { sendReservationReminder } from "./email"

/**
 * Process and send reminder emails for upcoming reservations
 * This should be run by a cron job (e.g., every hour)
 */
export async function processReservationReminders() {
  console.log("[CRON] Starting reservation reminder job...")

  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  }

  try {
    // Get all active restaurant settings to know which ones want reminders
    const allSettings = await db.query.restaurantSettings.findMany({
      where: eq(restaurantSettings.sendReminderEmail, true),
    })

    if (allSettings.length === 0) {
      console.log("[CRON] No restaurants have email reminders enabled")
      return results
    }

    console.log(`[CRON] Found ${allSettings.length} restaurants with reminders enabled`)

    // Process each restaurant's settings
    for (const settings of allSettings) {
      const reminderHours = settings.reminderHoursBefore || 24

      // Calculate the time window for reminders
      // We want reservations that are exactly reminderHours away (±1 hour window)
      const now = new Date()
      const targetTime = new Date(now.getTime() + reminderHours * 60 * 60 * 1000)
      const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000) // 30 min before
      const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000) // 30 min after

      // Find reservations in this time window that haven't had reminders sent
      const upcomingReservations = await db.query.reservations.findMany({
        where: and(
          eq(reservations.restaurantId, settings.restaurantId),
          gte(reservations.reservationDate, windowStart),
          lte(reservations.reservationDate, windowEnd),
          eq(reservations.reminderSent, false),
          eq(reservations.status, "confirmed") // Only send reminders for confirmed reservations
        ),
        with: {
          restaurant: true,
        },
      })

      console.log(
        `[CRON] Restaurant ${settings.restaurantId}: Found ${upcomingReservations.length} reservations needing reminders`
      )

      // Send reminder for each reservation
      for (const reservation of upcomingReservations) {
        results.processed++

        try {
          // Send reminder email
          await sendReservationReminder({
            guestEmail: reservation.guestEmail,
            guestName: reservation.guestName,
            restaurantName: reservation.restaurant.name,
            restaurantPhone: reservation.restaurant.phone,
            reservationDate: reservation.reservationDate,
            partySize: reservation.partySize,
            confirmationToken: reservation.confirmationToken!,
          })

          // Mark reminder as sent
          await db
            .update(reservations)
            .set({
              reminderSent: true,
              reminderSentAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(reservations.id, reservation.id))

          results.sent++
          console.log(`[CRON] ✓ Sent reminder for reservation ${reservation.id}`)
        } catch (error) {
          results.errors++
          console.error(
            `[CRON] ✗ Failed to send reminder for reservation ${reservation.id}:`,
            error
          )
          // Continue processing other reservations even if one fails
        }
      }
    }

    console.log("[CRON] Reminder job completed:", results)
    return results
  } catch (error) {
    console.error("[CRON] Fatal error in reminder job:", error)
    throw error
  }
}

/**
 * Get upcoming reservations that need reminders (for debugging/testing)
 */
export async function getUpcomingReservationsNeedingReminders(restaurantId?: string) {
  const now = new Date()
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  let conditions = [
    gte(reservations.reservationDate, now),
    lte(reservations.reservationDate, in24Hours),
    eq(reservations.reminderSent, false),
    eq(reservations.status, "confirmed"),
  ]

  if (restaurantId) {
    conditions.push(eq(reservations.restaurantId, restaurantId))
  }

  const upcomingReservations = await db.query.reservations.findMany({
    where: and(...conditions),
    with: {
      restaurant: true,
    },
    orderBy: [reservations.reservationDate],
  })

  return upcomingReservations
}
