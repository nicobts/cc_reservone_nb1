"use client"

import { createORPCClient } from "@orpc/client"
import type { AppRouter } from "@/server/api"

export const orpcClient = createORPCClient<AppRouter>({
  baseURL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/rpc`,
})
