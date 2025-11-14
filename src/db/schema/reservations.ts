import { pgTable, text, timestamp, uuid, integer, boolean, pgEnum } from "drizzle-orm/pg-core"
import { restaurants } from "./restaurants"
import { tables } from "./tables"
import { users } from "./users"

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "seated",
  "completed",
  "cancelled",
  "no_show",
])

export const reservationSourceEnum = pgEnum("reservation_source", [
  "website",
  "phone",
  "walk_in",
  "whatsapp",
  "telegram",
  "chatbot",
])

export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  tableId: uuid("table_id").references(() => tables.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

  // Guest information (for non-registered users)
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone").notNull(),

  // Reservation details
  reservationDate: timestamp("reservation_date", { mode: "date" }).notNull(),
  duration: integer("duration").notNull().default(120), // in minutes
  partySize: integer("party_size").notNull(),

  // Status
  status: reservationStatusEnum("status").notNull().default("pending"),
  source: reservationSourceEnum("source").notNull().default("website"),

  // Special requests
  specialRequests: text("special_requests"),
  dietaryRestrictions: text("dietary_restrictions"),
  occasion: text("occasion"), // birthday, anniversary, etc.

  // Internal notes
  internalNotes: text("internal_notes"),

  // Confirmation
  confirmationToken: text("confirmation_token"),
  confirmedAt: timestamp("confirmed_at", { mode: "date" }),

  // Check-in/out
  checkedInAt: timestamp("checked_in_at", { mode: "date" }),
  checkedOutAt: timestamp("checked_out_at", { mode: "date" }),

  // Cancellation
  cancelledAt: timestamp("cancelled_at", { mode: "date" }),
  cancellationReason: text("cancellation_reason"),

  // Deposit/prepayment
  requiresDeposit: boolean("requires_deposit").notNull().default(false),
  depositAmount: integer("deposit_amount"), // in cents
  depositPaid: boolean("deposit_paid").notNull().default(false),

  // Reminders
  reminderSent: boolean("reminder_sent").notNull().default(false),
  reminderSentAt: timestamp("reminder_sent_at", { mode: "date" }),

  // Metadata
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})

export const reservationHistory = pgTable("reservation_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  reservationId: uuid("reservation_id")
    .notNull()
    .references(() => reservations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // created, confirmed, cancelled, modified, etc.
  changes: text("changes"), // JSON string of what changed
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})
