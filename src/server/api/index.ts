import { oc } from "orpc"
import { restaurantRouter } from "./routers/restaurant"
import { reservationRouter } from "./routers/reservation"
import { tablesRouter } from "./routers/tables"

export const appRouter = oc.router({
  restaurant: restaurantRouter,
  reservation: reservationRouter,
  tables: tablesRouter,
})

export type AppRouter = typeof appRouter
