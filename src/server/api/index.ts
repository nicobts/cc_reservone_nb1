import { oc } from "orpc"
import { restaurantRouter } from "./routers/restaurant"
import { reservationRouter } from "./routers/reservation"
import { tablesRouter } from "./routers/tables"
import { operatingHoursRouter } from "./routers/operating-hours"
import { settingsRouter } from "./routers/settings"
import { paymentRouter } from "./routers/payment"

export const appRouter = oc.router({
  restaurant: restaurantRouter,
  reservation: reservationRouter,
  tables: tablesRouter,
  operatingHours: operatingHoursRouter,
  settings: settingsRouter,
  payment: paymentRouter,
})

export type AppRouter = typeof appRouter
