import { auth } from "./auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { User, Session } from "./auth"

/**
 * Get the current session on the server side
 */
export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return session
}

/**
 * Get the current user on the server side
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  return session?.user ?? null
}

/**
 * Require authentication - redirect to sign in if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  return user
}

/**
 * Require specific role - redirect if user doesn't have the role
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<User> {
  const user = await requireAuth()

  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard")
  }

  return user
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role
}
