import { pgTable, text, timestamp, uuid, integer, pgEnum } from "drizzle-orm/pg-core"
import { reservations } from "./reservations"
import { restaurants } from "./restaurants"

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "refunded",
])

export const paymentMethodEnum = pgEnum("payment_method", [
  "card",
  "bank_transfer",
  "cash",
  "other",
])

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  reservationId: uuid("reservation_id")
    .notNull()
    .references(() => reservations.id, { onDelete: "cascade" }),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),

  // Amount
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),

  // Payment provider
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeChargeId: text("stripe_charge_id"),

  // Status
  status: paymentStatusEnum("status").notNull().default("pending"),
  method: paymentMethodEnum("method").notNull(),

  // Refund
  refundedAmount: integer("refunded_amount").default(0),
  refundedAt: timestamp("refunded_at", { mode: "date" }),
  refundReason: text("refund_reason"),

  // Metadata
  metadata: text("metadata"), // JSON string for additional data
  errorMessage: text("error_message"),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})
