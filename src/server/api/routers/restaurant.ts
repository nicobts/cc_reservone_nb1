import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { ORPCError, oc } from "orpc"
import { publicProcedure, protectedProcedure, ownerProcedure } from "../router"
import { restaurants, restaurantSettings } from "@/db/schema"
import { createRestaurantSchema } from "@/types"

export const restaurantRouter = oc
  .tag("Restaurant")
  .route({
    // Public: Get restaurant by slug
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .output(z.any())
      .func(async ({ input, context }) => {
        const restaurant = await context.db.query.restaurants.findFirst({
          where: eq(restaurants.slug, input.slug),
          with: {
            operatingHours: true,
          },
        })

        if (!restaurant) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found",
          })
        }

        return restaurant
      }),

    // Protected: Get my restaurants
    getMyRestaurants: protectedProcedure.output(z.any()).func(async ({ context }) => {
      const userRestaurants = await context.db.query.restaurants.findMany({
        where: eq(restaurants.ownerId, context.user.id),
        orderBy: (restaurants, { desc }) => [desc(restaurants.createdAt)],
      })

      return userRestaurants
    }),

    // Owner only: Create restaurant
    create: ownerProcedure
      .input(createRestaurantSchema)
      .output(z.any())
      .func(async ({ input, context }) => {
        // Generate slug from name
        const slug = input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")

        // Check if slug exists
        const existingRestaurant = await context.db.query.restaurants.findFirst({
          where: eq(restaurants.slug, slug),
        })

        if (existingRestaurant) {
          throw new ORPCError({
            code: "CONFLICT",
            message: "A restaurant with this name already exists",
          })
        }

        const [newRestaurant] = await context.db
          .insert(restaurants)
          .values({
            ...input,
            slug,
            ownerId: context.user.id,
          })
          .returning()

        // Create default settings
        await context.db.insert(restaurantSettings).values({
          restaurantId: newRestaurant!.id,
        })

        return newRestaurant
      }),

    // Owner only: Update restaurant
    update: ownerProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          data: createRestaurantSchema.partial(),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        // Verify ownership
        const restaurant = await context.db.query.restaurants.findFirst({
          where: and(eq(restaurants.id, input.id), eq(restaurants.ownerId, context.user.id)),
        })

        if (!restaurant) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found or you don't have permission to update it",
          })
        }

        const [updated] = await context.db
          .update(restaurants)
          .set({
            ...input.data,
            updatedAt: new Date(),
          })
          .where(eq(restaurants.id, input.id))
          .returning()

        return updated
      }),

    // Owner only: Delete restaurant
    delete: ownerProcedure
      .input(z.object({ id: z.string().uuid() }))
      .output(z.object({ success: z.boolean() }))
      .func(async ({ input, context }) => {
        // Verify ownership
        const restaurant = await context.db.query.restaurants.findFirst({
          where: and(eq(restaurants.id, input.id), eq(restaurants.ownerId, context.user.id)),
        })

        if (!restaurant) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found or you don't have permission to delete it",
          })
        }

        await context.db.delete(restaurants).where(eq(restaurants.id, input.id))

        return { success: true }
      }),
  })
