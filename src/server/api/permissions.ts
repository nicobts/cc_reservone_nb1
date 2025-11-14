import { ORPCError } from "orpc"
import { eq, and } from "drizzle-orm"
import type { db } from "@/db"
import { restaurants, restaurantStaff, tables, reservations } from "@/db/schema"

type Database = typeof db

export interface User {
  id: string
  role: string
}

/**
 * Check if user owns a restaurant
 */
export async function verifyRestaurantOwnership(
  db: Database,
  restaurantId: string,
  userId: string
): Promise<void> {
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.id, restaurantId),
  })

  if (!restaurant) {
    throw new ORPCError({
      code: "NOT_FOUND",
      message: "Restaurant not found",
    })
  }

  if (restaurant.ownerId !== userId) {
    throw new ORPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this restaurant",
    })
  }
}

/**
 * Check if user has access to a restaurant (owner or staff)
 */
export async function verifyRestaurantAccess(
  db: Database,
  restaurantId: string,
  userId: string
): Promise<void> {
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.id, restaurantId),
  })

  if (!restaurant) {
    throw new ORPCError({
      code: "NOT_FOUND",
      message: "Restaurant not found",
    })
  }

  // Check if user is owner
  if (restaurant.ownerId === userId) {
    return
  }

  // Check if user is staff member
  const staffMember = await db.query.restaurantStaff.findFirst({
    where: and(
      eq(restaurantStaff.restaurantId, restaurantId),
      eq(restaurantStaff.userId, userId),
      eq(restaurantStaff.isActive, true)
    ),
  })

  if (!staffMember) {
    throw new ORPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this restaurant",
    })
  }
}

/**
 * Check if user has access to a table (via restaurant ownership/staff)
 */
export async function verifyTableAccess(
  db: Database,
  tableId: string,
  userId: string
): Promise<void> {
  const table = await db.query.tables.findFirst({
    where: eq(tables.id, tableId),
    with: {
      restaurant: true,
    },
  })

  if (!table) {
    throw new ORPCError({
      code: "NOT_FOUND",
      message: "Table not found",
    })
  }

  // Verify access to the restaurant
  await verifyRestaurantAccess(db, table.restaurantId, userId)
}

/**
 * Check if user has access to a reservation (via restaurant ownership/staff)
 */
export async function verifyReservationAccess(
  db: Database,
  reservationId: string,
  userId: string
): Promise<void> {
  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.id, reservationId),
  })

  if (!reservation) {
    throw new ORPCError({
      code: "NOT_FOUND",
      message: "Reservation not found",
    })
  }

  // Verify access to the restaurant
  await verifyRestaurantAccess(db, reservation.restaurantId, userId)
}

/**
 * Get all restaurant IDs that user has access to
 */
export async function getUserRestaurantIds(
  db: Database,
  userId: string
): Promise<string[]> {
  // Get owned restaurants
  const ownedRestaurants = await db.query.restaurants.findMany({
    where: eq(restaurants.ownerId, userId),
    columns: {
      id: true,
    },
  })

  // Get staff restaurants
  const staffAssignments = await db.query.restaurantStaff.findMany({
    where: and(eq(restaurantStaff.userId, userId), eq(restaurantStaff.isActive, true)),
    columns: {
      restaurantId: true,
    },
  })

  const restaurantIds = [
    ...ownedRestaurants.map((r) => r.id),
    ...staffAssignments.map((s) => s.restaurantId),
  ]

  return [...new Set(restaurantIds)] // Remove duplicates
}
