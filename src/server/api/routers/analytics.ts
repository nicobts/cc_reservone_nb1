import { z } from "zod"
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm"
import { ORPCError, oc } from "orpc"
import { protectedProcedure } from "../router"
import { reservations, payments, restaurants, tables } from "@/db/schema"
import { verifyRestaurantAccess } from "../permissions"

export const analyticsRouter = oc
  .tag("Analytics")
  .route({
    // Get dashboard overview stats
    getDashboardStats: protectedProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        await verifyRestaurantAccess(context.db, input.restaurantId, context.user.id)

        const startDate = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const endDate = input.endDate || new Date()

        // Get reservation counts by status
        const reservationStats = await context.db
          .select({
            status: reservations.status,
            count: count(),
          })
          .from(reservations)
          .where(
            and(
              eq(reservations.restaurantId, input.restaurantId),
              gte(reservations.reservationDate, startDate),
              lte(reservations.reservationDate, endDate)
            )
          )
          .groupBy(reservations.status)

        // Get revenue stats
        const revenueStats = await context.db
          .select({
            totalRevenue: sql<number>`SUM(${payments.amount})`,
            paidCount: count(),
          })
          .from(payments)
          .where(
            and(
              eq(payments.restaurantId, input.restaurantId),
              eq(payments.status, "succeeded"),
              gte(payments.createdAt, startDate),
              lte(payments.createdAt, endDate)
            )
          )

        // Get total reservations
        const totalReservations = reservationStats.reduce((sum, stat) => sum + stat.count, 0)

        // Calculate no-show rate
        const noShowStat = reservationStats.find((s) => s.status === "no_show")
        const completedStat = reservationStats.find((s) => s.status === "completed")
        const noShowRate =
          totalReservations > 0
            ? ((noShowStat?.count || 0) / totalReservations) * 100
            : 0

        // Calculate completion rate
        const completionRate =
          totalReservations > 0
            ? ((completedStat?.count || 0) / totalReservations) * 100
            : 0

        // Get average party size
        const avgPartySizeResult = await context.db
          .select({
            avgSize: sql<number>`AVG(${reservations.partySize})`,
          })
          .from(reservations)
          .where(
            and(
              eq(reservations.restaurantId, input.restaurantId),
              gte(reservations.reservationDate, startDate),
              lte(reservations.reservationDate, endDate)
            )
          )

        return {
          totalReservations,
          reservationsByStatus: reservationStats,
          revenue: {
            total: revenueStats[0]?.totalRevenue || 0,
            paidReservations: revenueStats[0]?.paidCount || 0,
          },
          metrics: {
            noShowRate: Math.round(noShowRate * 10) / 10,
            completionRate: Math.round(completionRate * 10) / 10,
            averagePartySize: Math.round((avgPartySizeResult[0]?.avgSize || 0) * 10) / 10,
          },
          dateRange: {
            start: startDate,
            end: endDate,
          },
        }
      }),

    // Get reservations over time (for chart)
    getReservationsTrend: protectedProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          startDate: z.date(),
          endDate: z.date(),
          groupBy: z.enum(["day", "week", "month"]).default("day"),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        await verifyRestaurantAccess(context.db, input.restaurantId, context.user.id)

        // Get reservations grouped by date
        const trend = await context.db
          .select({
            date: sql<string>`DATE(${reservations.reservationDate})`,
            count: count(),
            totalGuests: sql<number>`SUM(${reservations.partySize})`,
          })
          .from(reservations)
          .where(
            and(
              eq(reservations.restaurantId, input.restaurantId),
              gte(reservations.reservationDate, input.startDate),
              lte(reservations.reservationDate, input.endDate)
            )
          )
          .groupBy(sql`DATE(${reservations.reservationDate})`)
          .orderBy(sql`DATE(${reservations.reservationDate})`)

        return trend
      }),

    // Get revenue over time
    getRevenueTrend: protectedProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        await verifyRestaurantAccess(context.db, input.restaurantId, context.user.id)

        const trend = await context.db
          .select({
            date: sql<string>`DATE(${payments.createdAt})`,
            revenue: sql<number>`SUM(${payments.amount})`,
            count: count(),
          })
          .from(payments)
          .where(
            and(
              eq(payments.restaurantId, input.restaurantId),
              eq(payments.status, "succeeded"),
              gte(payments.createdAt, input.startDate),
              lte(payments.createdAt, input.endDate)
            )
          )
          .groupBy(sql`DATE(${payments.createdAt})`)
          .orderBy(sql`DATE(${payments.createdAt})`)

        return trend
      }),

    // Get popular booking times
    getPopularTimes: protectedProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        await verifyRestaurantAccess(context.db, input.restaurantId, context.user.id)

        const startDate = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const endDate = input.endDate || new Date()

        // Get bookings by hour
        const timeDistribution = await context.db
          .select({
            hour: sql<number>`EXTRACT(HOUR FROM ${reservations.reservationDate})`,
            count: count(),
          })
          .from(reservations)
          .where(
            and(
              eq(reservations.restaurantId, input.restaurantId),
              gte(reservations.reservationDate, startDate),
              lte(reservations.reservationDate, endDate)
            )
          )
          .groupBy(sql`EXTRACT(HOUR FROM ${reservations.reservationDate})`)
          .orderBy(sql`EXTRACT(HOUR FROM ${reservations.reservationDate})`)

        // Get bookings by day of week
        const dayDistribution = await context.db
          .select({
            dayOfWeek: sql<number>`EXTRACT(DOW FROM ${reservations.reservationDate})`,
            count: count(),
          })
          .from(reservations)
          .where(
            and(
              eq(reservations.restaurantId, input.restaurantId),
              gte(reservations.reservationDate, startDate),
              lte(reservations.reservationDate, endDate)
            )
          )
          .groupBy(sql`EXTRACT(DOW FROM ${reservations.reservationDate})`)
          .orderBy(sql`EXTRACT(DOW FROM ${reservations.reservationDate})`)

        return {
          byHour: timeDistribution,
          byDayOfWeek: dayDistribution,
        }
      }),

    // Get table utilization stats
    getTableUtilization: protectedProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        await verifyRestaurantAccess(context.db, input.restaurantId, context.user.id)

        const startDate = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const endDate = input.endDate || new Date()

        // Get all tables for the restaurant
        const allTables = await context.db.query.tables.findMany({
          where: eq(tables.restaurantId, input.restaurantId),
        })

        // Get reservation count per table
        const tableUsage = await context.db
          .select({
            tableId: reservations.tableId,
            count: count(),
          })
          .from(reservations)
          .where(
            and(
              eq(reservations.restaurantId, input.restaurantId),
              gte(reservations.reservationDate, startDate),
              lte(reservations.reservationDate, endDate)
            )
          )
          .groupBy(reservations.tableId)

        // Calculate utilization per table
        const utilizationByTable = allTables.map((table) => {
          const usage = tableUsage.find((u) => u.tableId === table.id)
          return {
            tableId: table.id,
            tableName: table.name,
            tableNumber: table.tableNumber,
            capacity: table.maxCapacity,
            reservationCount: usage?.count || 0,
          }
        })

        // Calculate overall metrics
        const totalCapacity = allTables.reduce((sum, t) => sum + t.maxCapacity, 0)
        const totalTables = allTables.length

        return {
          tables: utilizationByTable,
          summary: {
            totalTables,
            totalCapacity,
            averageUtilization:
              totalTables > 0
                ? Math.round(
                    (utilizationByTable.reduce((sum, t) => sum + t.reservationCount, 0) /
                      totalTables /
                      30) *
                      100
                  )
                : 0,
          },
        }
      }),

    // Get top customers
    getTopCustomers: protectedProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          limit: z.number().min(1).max(50).default(10),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        await verifyRestaurantAccess(context.db, input.restaurantId, context.user.id)

        const topCustomers = await context.db
          .select({
            guestEmail: reservations.guestEmail,
            guestName: reservations.guestName,
            visitCount: count(),
            totalGuests: sql<number>`SUM(${reservations.partySize})`,
          })
          .from(reservations)
          .where(eq(reservations.restaurantId, input.restaurantId))
          .groupBy(reservations.guestEmail, reservations.guestName)
          .orderBy(desc(count()))
          .limit(input.limit)

        return topCustomers
      }),
  })
