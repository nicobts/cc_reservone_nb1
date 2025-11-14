import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/", "/auth/signin", "/auth/signup", "/auth/forgot-password", "/api/auth"]
const authPaths = ["/auth/signin", "/auth/signup"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get("better-auth.session_token")

  // Check if path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path))

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (sessionCookie && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If user is not logged in and trying to access protected routes
  if (!sessionCookie && !isPublicPath) {
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
