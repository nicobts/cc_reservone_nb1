import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { ORPCError, oc } from "orpc"
import { publicProcedure, staffProcedure } from "../router"
import { tables, restaurants } from "@/db/schema"
import { createTableSchema } from "@/types"

export const tablesRouter = oc
  .tag("Tables")
  .route({
    // Staff: Get single table by ID
    getById: staffProcedure
      .input(z.object({ id: z.string().uuid() }))
      .output(z.any())
      .func(async ({ input, context }) => {
        const table = await context.db.query.tables.findFirst({
          where: eq(tables.id, input.id),
        })

        if (!table) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Table not found",
          })
        }

        // TODO: Verify user has access to this table's restaurant

        return table
      }),

    // Staff: Get tables for a restaurant
    getRestaurantTables: staffProcedure
      .input(z.object({ restaurantId: z.string().uuid() }))
      .output(z.any())
      .func(async ({ input, context }) => {
        // TODO: Verify user has access to this restaurant

        const restaurantTables = await context.db.query.tables.findMany({
          where: eq(tables.restaurantId, input.restaurantId),
          orderBy: (tables, { asc }) => [asc(tables.number)],
        })

        return restaurantTables
      }),

    // Staff: Create table
    create: staffProcedure
      .input(createTableSchema)
      .output(z.any())
      .func(async ({ input, context }) => {
        // Verify restaurant exists and user has access
        const restaurant = await context.db.query.restaurants.findFirst({
          where: eq(restaurants.id, input.restaurantId),
        })

        if (!restaurant) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found",
          })
        }

        // TODO: Verify user owns or manages this restaurant

        const [newTable] = await context.db
          .insert(tables)
          .values(input)
          .returning()

        return newTable
      }),

    // Staff: Update table
    update: staffProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          data: createTableSchema.partial().omit({ restaurantId: true }),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        // TODO: Verify user has access to this table's restaurant

        const [updated] = await context.db
          .update(tables)
          .set({
            ...input.data,
            updatedAt: new Date(),
          })
          .where(eq(tables.id, input.id))
          .returning()

        if (!updated) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Table not found",
          })
        }

        return updated
      }),

    // Staff: Delete table
    delete: staffProcedure
      .input(z.object({ id: z.string().uuid() }))
      .output(z.object({ success: z.boolean() }))
      .func(async ({ input, context }) => {
        // TODO: Verify user has access to this table's restaurant
        // TODO: Check if table has active reservations

        await context.db.delete(tables).where(eq(tables.id, input.id))

        return { success: true }
      }),

    // Staff: Toggle table active status
    toggleActive: staffProcedure
      .input(z.object({ id: z.string().uuid() }))
      .output(z.any())
      .func(async ({ input, context }) => {
        // Get current table
        const table = await context.db.query.tables.findFirst({
          where: eq(tables.id, input.id),
        })

        if (!table) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Table not found",
          })
        }

        // Toggle active status
        const [updated] = await context.db
          .update(tables)
          .set({
            isActive: !table.isActive,
            updatedAt: new Date(),
          })
          .where(eq(tables.id, input.id))
          .returning()

        return updated
      }),
  })
