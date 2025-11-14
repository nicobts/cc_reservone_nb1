import { oc } from "@orpc/server"
import { restaurantRouter } from "./routers/restaurant"
import { reservationRouter } from "./routers/reservation"
import { tablesRouter } from "./routers/tables"
import { operatingHoursRouter } from "./routers/operating-hours"
import { settingsRouter } from "./routers/settings"
import { paymentRouter } from "./routers/payment"
import { analyticsRouter } from "./routers/analytics"

export const appRouter = oc.router({
  restaurant: restaurantRouter,
  reservation: reservationRouter,
  tables: tablesRouter,
  operatingHours: operatingHoursRouter,
  settings: settingsRouter,
  payment: paymentRouter,
  analytics: analyticsRouter,
})

export type AppRouter = typeof appRouter
