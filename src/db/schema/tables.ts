import { pgTable, text, timestamp, uuid, integer, boolean, pgEnum } from "drizzle-orm/pg-core"
import { restaurants } from "./restaurants"

export const tableShapeEnum = pgEnum("table_shape", ["round", "square", "rectangle"])
export const tableLocationEnum = pgEnum("table_location", [
  "indoor",
  "outdoor",
  "patio",
  "bar",
  "private_room",
])

export const tables = pgTable("tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Table 1", "Booth 3"
  number: integer("number").notNull(),
  minCapacity: integer("min_capacity").notNull(),
  maxCapacity: integer("max_capacity").notNull(),
  shape: tableShapeEnum("shape").default("rectangle"),
  location: tableLocationEnum("location").default("indoor"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})
