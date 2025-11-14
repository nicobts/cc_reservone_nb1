import { pgTable, text, timestamp, uuid, integer, boolean, json } from "drizzle-orm/pg-core"
import { restaurants } from "./restaurants"

export const restaurantSettings = pgTable("restaurant_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" })
    .unique(),

  // Reservation settings
  advanceBookingDays: integer("advance_booking_days").notNull().default(30),
  minAdvanceBookingHours: integer("min_advance_booking_hours").notNull().default(2),
  maxPartySize: integer("max_party_size").notNull().default(12),
  defaultReservationDuration: integer("default_reservation_duration").notNull().default(120), // minutes
  slotInterval: integer("slot_interval").notNull().default(15), // minutes

  // Deposit settings
  requireDepositForPartySize: integer("require_deposit_for_party_size"), // null = no deposit required
  depositAmount: integer("deposit_amount"), // in cents
  depositPercentage: integer("deposit_percentage"), // 0-100

  // Cancellation policy
  cancellationPolicy: text("cancellation_policy"),
  allowCancellation: boolean("allow_cancellation").notNull().default(true),
  cancellationDeadlineHours: integer("cancellation_deadline_hours").default(24),

  // Auto-confirmation
  autoConfirmReservations: boolean("auto_confirm_reservations").notNull().default(false),

  // Reminders
  sendReminderEmail: boolean("send_reminder_email").notNull().default(true),
  sendReminderSMS: boolean("send_reminder_sms").notNull().default(false),
  reminderHoursBefore: integer("reminder_hours_before").notNull().default(24),

  // Table management
  allowTableSelection: boolean("allow_table_selection").notNull().default(false),
  autoAssignTables: boolean("auto_assign_tables").notNull().default(true),

  // Waitlist
  enableWaitlist: boolean("enable_waitlist").notNull().default(false),
  waitlistAutoExpireMinutes: integer("waitlist_auto_expire_minutes").default(15),

  // Special days/holidays
  closedDates: json("closed_dates").$type<string[]>().default([]), // ISO date strings
  specialHours: json("special_hours").$type<Record<string, { open: string; close: string }>>().default({}),

  // AI/Chatbot settings (Phase 2)
  enableAIChatbot: boolean("enable_ai_chatbot").notNull().default(false),
  enableWhatsApp: boolean("enable_whatsapp").notNull().default(false),
  enableTelegram: boolean("enable_telegram").notNull().default(false),
  chatbotGreeting: text("chatbot_greeting"),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})
