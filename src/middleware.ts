import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

const publicPaths = ["/", "/auth/signin", "/auth/signup", "/auth/forgot-password"]
const authPaths = ["/auth/signin", "/auth/signup"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow API routes and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // Check if path is public
  const isPublicPath = publicPaths.some((path) => pathname === path)
  const isAuthPath = authPaths.some((path) => pathname === path)

  // Get session
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (session && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If user is not logged in and trying to access protected routes
  if (!session && !isPublicPath && !pathname.startsWith("/auth/")) {
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
