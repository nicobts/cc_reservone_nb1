import { pgTable, text, timestamp, uuid, boolean, pgEnum } from "drizzle-orm/pg-core"
import { users } from "./users"
import { reservations } from "./reservations"

export const notificationTypeEnum = pgEnum("notification_type", [
  "reservation_confirmation",
  "reservation_reminder",
  "reservation_cancelled",
  "reservation_modified",
  "payment_received",
  "payment_failed",
])

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "sms",
  "whatsapp",
  "telegram",
  "push",
])

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
  "delivered",
  "read",
])

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  reservationId: uuid("reservation_id").references(() => reservations.id, {
    onDelete: "cascade",
  }),

  // Notification details
  type: notificationTypeEnum("type").notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  status: notificationStatusEnum("status").notNull().default("pending"),

  // Content
  subject: text("subject"),
  message: text("message").notNull(),

  // Recipient (for non-users)
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),

  // Delivery
  sentAt: timestamp("sent_at", { mode: "date" }),
  deliveredAt: timestamp("delivered_at", { mode: "date" }),
  readAt: timestamp("read_at", { mode: "date" }),

  // Error tracking
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),

  // External IDs
  externalId: text("external_id"), // Resend, Twilio, etc.

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Email preferences
  emailReservationConfirmation: boolean("email_reservation_confirmation").default(true),
  emailReservationReminder: boolean("email_reservation_reminder").default(true),
  emailReservationCancelled: boolean("email_reservation_cancelled").default(true),
  emailMarketing: boolean("email_marketing").default(false),

  // SMS preferences
  smsReservationConfirmation: boolean("sms_reservation_confirmation").default(false),
  smsReservationReminder: boolean("sms_reservation_reminder").default(false),

  // WhatsApp preferences
  whatsappReservationConfirmation: boolean("whatsapp_reservation_confirmation").default(false),
  whatsappReservationReminder: boolean("whatsapp_reservation_reminder").default(false),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})
