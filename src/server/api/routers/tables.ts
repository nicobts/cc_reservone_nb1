import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { ORPCError, oc } from "orpc"
import { publicProcedure, staffProcedure } from "../router"
import { tables, restaurants } from "@/db/schema"
import { createTableSchema } from "@/types"
import { verifyTableAccess, verifyRestaurantAccess } from "../permissions"

export const tablesRouter = oc
  .tag("Tables")
  .route({
    // Staff: Get single table by ID
    getById: staffProcedure
      .input(z.object({ id: z.string().uuid() }))
      .output(z.any())
      .func(async ({ input, context }) => {
        // Verify access to table's restaurant
        await verifyTableAccess(context.db, input.id, context.user.id)

        const table = await context.db.query.tables.findFirst({
          where: eq(tables.id, input.id),
        })

        if (!table) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Table not found",
          })
        }

        return table
      }),

    // Staff: Get tables for a restaurant
    getRestaurantTables: staffProcedure
      .input(z.object({ restaurantId: z.string().uuid() }))
      .output(z.any())
      .func(async ({ input, context }) => {
        // Verify access to restaurant
        await verifyRestaurantAccess(context.db, input.restaurantId, context.user.id)

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
        // Verify access to restaurant
        await verifyRestaurantAccess(context.db, input.restaurantId, context.user.id)

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
        // Verify access to table's restaurant
        await verifyTableAccess(context.db, input.id, context.user.id)

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
        // Verify access to table's restaurant
        await verifyTableAccess(context.db, input.id, context.user.id)

        await context.db.delete(tables).where(eq(tables.id, input.id))

        return { success: true }
      }),

    // Staff: Toggle table active status
    toggleActive: staffProcedure
      .input(z.object({ id: z.string().uuid() }))
      .output(z.any())
      .func(async ({ input, context }) => {
        // Verify access to table's restaurant
        await verifyTableAccess(context.db, input.id, context.user.id)

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
