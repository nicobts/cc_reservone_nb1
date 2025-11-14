import { oc } from "@orpc/server"
import { restaurantRouter } from "./routers/restaurant"
import { reservationRouter } from "./routers/reservation"
import { tablesRouter } from "./routers/tables"
import { operatingHoursRouter } from "./routers/operating-hours"
import { settingsRouter } from "./routers/settings"
import { paymentRouter } from "./routers/payment"
import { analyticsRouter } from "./routers/analytics"
import { chatbotRouter } from "./routers/chatbot"

export const appRouter = oc.router({
  restaurant: restaurantRouter,
  reservation: reservationRouter,
  tables: tablesRouter,
  operatingHours: operatingHoursRouter,
  settings: settingsRouter,
  payment: paymentRouter,
  analytics: analyticsRouter,
  chatbot: chatbotRouter,
})

export type AppRouter = typeof appRouter
