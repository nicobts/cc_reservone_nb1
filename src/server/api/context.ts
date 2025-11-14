import { auth } from "@/lib/auth"
import { db } from "@/db"
import type { Session, User } from "@/lib/auth"

export async function createContext(headers: Headers) {
  const session = await auth.api.getSession({
    headers,
  })

  return {
    db,
    session: session as Session | null,
    user: session?.user as User | undefined,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
