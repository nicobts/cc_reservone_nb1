import { oc } from "orpc"
import { restaurantRouter } from "./routers/restaurant"
import { reservationRouter } from "./routers/reservation"
import { tablesRouter } from "./routers/tables"
import { operatingHoursRouter } from "./routers/operating-hours"

export const appRouter = oc.router({
  restaurant: restaurantRouter,
  reservation: reservationRouter,
  tables: tablesRouter,
  operatingHours: operatingHoursRouter,
})

export type AppRouter = typeof appRouter
