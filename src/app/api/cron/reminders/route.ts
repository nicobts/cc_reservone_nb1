import { NextRequest, NextResponse } from "next/server"
import { processReservationReminders } from "@/lib/cron"

/**
 * Cron endpoint for sending reservation reminders
 *
 * This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
 * at regular intervals (recommended: every hour)
 *
 * Security:
 * - Protected by CRON_SECRET environment variable
 * - Only accessible with valid Authorization header
 *
 * Example cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/reminders",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 *
 * Example manual trigger:
 * curl -X POST https://yourdomain.com/api/cron/reminders \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }
    } else {
      console.warn("[CRON] Warning: CRON_SECRET not set! Endpoint is not secured.")
    }

    // Process reminders
    const results = await processReservationReminders()

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[CRON] Error processing reminders:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for checking cron job status (debugging)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret) {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
  }

  return NextResponse.json({
    status: "ready",
    cronSecret: cronSecret ? "configured" : "not configured (insecure)",
    endpoint: "/api/cron/reminders",
    method: "POST",
    timestamp: new Date().toISOString(),
  })
}
