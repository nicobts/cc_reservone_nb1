import { relations } from "drizzle-orm"
import { users } from "./users"
import { restaurants, restaurantStaff, operatingHours } from "./restaurants"
import { tables } from "./tables"
import { reservations, reservationHistory } from "./reservations"
import { payments } from "./payments"
import { restaurantSettings } from "./settings"

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedRestaurants: many(restaurants),
  staffAssignments: many(restaurantStaff),
  reservations: many(reservations),
}))

// Restaurant relations
export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, {
    fields: [restaurants.ownerId],
    references: [users.id],
  }),
  tables: many(tables),
  reservations: many(reservations),
  staff: many(restaurantStaff),
  operatingHours: many(operatingHours),
  settings: one(restaurantSettings, {
    fields: [restaurants.id],
    references: [restaurantSettings.restaurantId],
  }),
}))

// Restaurant Staff relations
export const restaurantStaffRelations = relations(restaurantStaff, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantStaff.restaurantId],
    references: [restaurants.id],
  }),
  user: one(users, {
    fields: [restaurantStaff.userId],
    references: [users.id],
  }),
}))

// Operating Hours relations
export const operatingHoursRelations = relations(operatingHours, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [operatingHours.restaurantId],
    references: [restaurants.id],
  }),
}))

// Table relations
export const tablesRelations = relations(tables, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [tables.restaurantId],
    references: [restaurants.id],
  }),
  reservations: many(reservations),
}))

// Reservation relations
export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [reservations.restaurantId],
    references: [restaurants.id],
  }),
  table: one(tables, {
    fields: [reservations.tableId],
    references: [tables.id],
  }),
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
  history: many(reservationHistory),
  payment: one(payments, {
    fields: [reservations.id],
    references: [payments.reservationId],
  }),
}))

// Reservation History relations
export const reservationHistoryRelations = relations(reservationHistory, ({ one }) => ({
  reservation: one(reservations, {
    fields: [reservationHistory.reservationId],
    references: [reservations.id],
  }),
  user: one(users, {
    fields: [reservationHistory.userId],
    references: [users.id],
  }),
}))

// Payment relations
export const paymentsRelations = relations(payments, ({ one }) => ({
  reservation: one(reservations, {
    fields: [payments.reservationId],
    references: [reservations.id],
  }),
}))

// Restaurant Settings relations
export const restaurantSettingsRelations = relations(restaurantSettings, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantSettings.restaurantId],
    references: [restaurants.id],
  }),
}))
