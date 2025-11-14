"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { orpcClient } from "@/lib/orpc-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, XCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [verifying, setVerifying] = useState(true)
  const [verificationResult, setVerificationResult] = useState<{
    status: string
    reservationId?: string
  } | null>(null)

  // Verify the checkout session
  useEffect(() => {
    if (!sessionId) {
      setVerifying(false)
      return
    }

    const verifySession = async () => {
      try {
        const result = await orpcClient.payment.verifyCheckoutSession({ sessionId })
        setVerificationResult(result)
      } catch (error) {
        console.error("Failed to verify session:", error)
        setVerificationResult({ status: "error" })
      } finally {
        setVerifying(false)
      }
    }

    verifySession()
  }, [sessionId])

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Invalid Payment Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This payment link is invalid or has expired.
            </p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h3 className="text-lg font-semibold">Verifying Payment...</h3>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPaid = verificationResult?.status === "paid"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className={`rounded-full p-3 ${isPaid ? "bg-green-100" : "bg-yellow-100"}`}>
              {isPaid ? (
                <CheckCircle className="h-12 w-12 text-green-600" />
              ) : (
                <XCircle className="h-12 w-12 text-yellow-600" />
              )}
            </div>
          </div>
          <CardTitle className="text-3xl">
            {isPaid ? "Payment Successful!" : "Payment Processing"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isPaid ? (
            <>
              <div className="text-center space-y-2">
                <p className="text-lg">
                  Your deposit payment has been confirmed.
                </p>
                <p className="text-muted-foreground">
                  Your reservation is now confirmed! We've sent a confirmation email with all the details.
                </p>
              </div>

              <div className="rounded-lg bg-muted p-6 space-y-4">
                <h3 className="font-semibold text-lg">What's Next?</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>
                      <strong>Check your email</strong> - We've sent a confirmation with your reservation and payment receipt.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>
                      <strong>Reminder notification</strong> - You'll receive a reminder 24 hours before your reservation.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>
                      <strong>Manage your booking</strong> - View or cancel your reservation in your dashboard.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button asChild variant="outline">
                  <Link href="/">Back to Home</Link>
                </Button>
                <Button asChild>
                  <Link href="/my-reservations">View My Reservations</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-2">
                <p className="text-lg">
                  Your payment is being processed.
                </p>
                <p className="text-muted-foreground">
                  This may take a few moments. We'll send you an email once your payment is confirmed.
                </p>
              </div>

              <div className="flex flex-col gap-3 justify-center pt-4">
                <Button asChild>
                  <Link href="/my-reservations">View My Reservations</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </>
          )}

          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>Questions? Contact the restaurant directly using the details in your confirmation email.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
