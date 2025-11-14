import { pgTable, text, timestamp, uuid, integer, json, boolean } from "drizzle-orm/pg-core"
import { users } from "./users"

export const restaurants = pgTable("restaurants", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  website: text("website"),

  // Address
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  postalCode: text("postal_code").notNull(),

  // Location
  latitude: text("latitude"),
  longitude: text("longitude"),

  // Images
  logo: text("logo"),
  coverImage: text("cover_image"),
  images: json("images").$type<string[]>().default([]),

  // Settings
  timezone: text("timezone").notNull().default("UTC"),
  currency: text("currency").notNull().default("USD"),

  // Capacity
  maxCapacity: integer("max_capacity").notNull(),

  // Status
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),

  // Metadata
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})

export const restaurantStaff = pgTable("restaurant_staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // manager, host, server, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})

export const operatingHours = pgTable("operating_hours", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 6 = Saturday
  openTime: text("open_time").notNull(), // HH:MM format
  closeTime: text("close_time").notNull(), // HH:MM format
  isClosed: boolean("is_closed").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})
