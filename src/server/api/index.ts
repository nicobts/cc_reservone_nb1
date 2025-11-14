import { oc } from "orpc"
import { restaurantRouter } from "./routers/restaurant"
import { reservationRouter } from "./routers/reservation"

export const appRouter = oc.router({
  restaurant: restaurantRouter,
  reservation: reservationRouter,
})

export type AppRouter = typeof appRouter
