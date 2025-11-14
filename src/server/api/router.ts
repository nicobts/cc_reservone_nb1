import { ORPCError, os } from "@orpc/server"
import type { Context } from "./context"

// Create base procedure
export const publicProcedure = os.context<Context>()

// Protected procedure - requires authentication
export const protectedProcedure = publicProcedure.use(async (input, context, meta) => {
  if (!context.user) {
    throw new ORPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    })
  }

  return meta.next({
    context: {
      ...context,
      user: context.user,
    },
  })
})

// Role-based procedures
export const ownerProcedure = protectedProcedure.use(async (input, context, meta) => {
  if (context.user.role !== "owner") {
    throw new ORPCError({
      code: "FORBIDDEN",
      message: "You must be an owner to access this resource",
    })
  }

  return meta.next({ context })
})

export const staffProcedure = protectedProcedure.use(async (input, context, meta) => {
  if (!["owner", "manager", "staff"].includes(context.user.role)) {
    throw new ORPCError({
      code: "FORBIDDEN",
      message: "You must be staff to access this resource",
    })
  }

  return meta.next({ context })
})
