"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Clock, Users, Mail, Phone } from "lucide-react"

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const reservationId = searchParams.get("id")

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl">Reservation Confirmed!</CardTitle>
          <CardDescription className="text-base">
            Thank you for your reservation. We've sent a confirmation email with all the details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-6 space-y-4">
            <h3 className="font-semibold text-lg">What's Next?</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <span>
                  <strong>Check your email</strong> - We've sent a confirmation with your reservation details and a cancellation link if needed.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <span>
                  <strong>Reminder notification</strong> - You'll receive a reminder 24 hours before your reservation.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <span>
                  <strong>Need to make changes?</strong> - Contact the restaurant directly or use the cancellation link in your email.
                </span>
              </li>
            </ul>
          </div>

          {reservationId && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Reservation ID</p>
              <p className="font-mono text-sm bg-muted px-3 py-2 rounded inline-block">
                {reservationId}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
            <Button asChild>
              <Link href="/my-reservations">View My Reservations</Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Questions? Contact the restaurant directly using the details in your confirmation email.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
