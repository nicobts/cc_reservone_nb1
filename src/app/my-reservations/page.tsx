"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { orpcClient } from "@/lib/orpc-client"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Calendar, Clock, Users, MapPin, X, Loader2, CalendarX, UtensilsCrossed } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function MyReservationsPage() {
  const router = useRouter()
  const { data: session, isPending: isSessionLoading } = useSession()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const queryClient = useQueryClient()

  // Redirect to sign in if not authenticated
  if (!isSessionLoading && !session) {
    router.push("/auth/signin?redirect=/my-reservations")
    return null
  }

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["myReservations", statusFilter],
    queryFn: async () => {
      return await orpcClient.reservation.getMyReservations(
        statusFilter !== "all" ? { status: statusFilter as any } : undefined
      )
    },
    enabled: !!session,
  })

  const cancelMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      return await orpcClient.reservation.cancel({ id: reservationId })
    },
    onSuccess: () => {
      toast.success("Reservation cancelled successfully")
      queryClient.invalidateQueries({ queryKey: ["myReservations"] })
    },
    onError: (error) => {
      console.error("Failed to cancel reservation:", error)
      toast.error("Failed to cancel reservation. Please try again.")
    },
  })

  const upcomingReservations = reservations.filter((r: any) => {
    const isUpcoming = new Date(r.reservationDate) > new Date()
    const isActive = r.status === "pending" || r.status === "confirmed"
    return isUpcoming && isActive
  })

  const pastReservations = reservations.filter((r: any) => {
    const isPast = new Date(r.reservationDate) <= new Date()
    const isInactive = r.status === "completed" || r.status === "cancelled" || r.status === "no_show"
    return isPast || isInactive
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "seated":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "no_show":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const canCancel = (reservation: any) => {
    const reservationDate = new Date(reservation.reservationDate)
    const now = new Date()
    const hoursUntilReservation = (reservationDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    return (
      (reservation.status === "pending" || reservation.status === "confirmed") &&
      hoursUntilReservation > 2 // Must be at least 2 hours before reservation
    )
  }

  if (isSessionLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">My Reservations</h1>
          <p className="text-lg text-muted-foreground">
            View and manage your restaurant bookings
          </p>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filter by status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reservations</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Reservations */}
        {statusFilter === "all" && upcomingReservations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Upcoming</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingReservations.map((reservation: any) => (
                <Card key={reservation.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{reservation.restaurant.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {reservation.restaurant.cuisineType && (
                            <span className="capitalize">{reservation.restaurant.cuisineType}</span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(reservation.status)}>
                        {reservation.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(reservation.reservationDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(reservation.reservationDate).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.partySize} guests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.restaurant.city}</span>
                      </div>
                    </div>

                    {reservation.specialRequests && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          <strong>Special Requests:</strong> {reservation.specialRequests}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/book/${reservation.restaurant.slug}`}>
                          View Restaurant
                        </Link>
                      </Button>

                      {canCancel(reservation) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Reservation?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel your reservation at{" "}
                                {reservation.restaurant.name} on{" "}
                                {new Date(reservation.reservationDate).toLocaleDateString()}?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => cancelMutation.mutate(reservation.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Cancel Reservation
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Reservations */}
        {statusFilter === "all" && pastReservations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Past</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {pastReservations.map((reservation: any) => (
                <Card key={reservation.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{reservation.restaurant.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {reservation.restaurant.cuisineType && (
                            <span className="capitalize">{reservation.restaurant.cuisineType}</span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(reservation.status)}>
                        {reservation.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(reservation.reservationDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(reservation.reservationDate).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.partySize} guests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.restaurant.city}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Filtered Results */}
        {statusFilter !== "all" && reservations.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {reservations.map((reservation: any) => (
              <Card key={reservation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{reservation.restaurant.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {reservation.restaurant.cuisineType && (
                          <span className="capitalize">{reservation.restaurant.cuisineType}</span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(reservation.status)}>
                      {reservation.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(reservation.reservationDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(reservation.reservationDate).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{reservation.partySize} guests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{reservation.restaurant.city}</span>
                    </div>
                  </div>

                  {reservation.specialRequests && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        <strong>Special Requests:</strong> {reservation.specialRequests}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/book/${reservation.restaurant.slug}`}>
                        View Restaurant
                      </Link>
                    </Button>

                    {canCancel(reservation) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Reservation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your reservation at{" "}
                              {reservation.restaurant.name} on{" "}
                              {new Date(reservation.reservationDate).toLocaleDateString()}?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelMutation.mutate(reservation.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Cancel Reservation
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {reservations.length === 0 && (
          <Card className="py-20">
            <CardContent className="text-center space-y-4">
              {statusFilter === "all" ? (
                <>
                  <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">No reservations yet</h3>
                  <p className="text-muted-foreground">
                    Start exploring restaurants and make your first booking!
                  </p>
                  <Button asChild size="lg" className="mt-4">
                    <Link href="/restaurants">Browse Restaurants</Link>
                  </Button>
                </>
              ) : (
                <>
                  <CalendarX className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">
                    No {statusFilter} reservations
                  </h3>
                  <p className="text-muted-foreground">
                    Try changing the filter to see other reservations.
                  </p>
                  <Button variant="outline" onClick={() => setStatusFilter("all")}>
                    Show All Reservations
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Back to Home */}
        <div className="flex justify-center pt-8">
          <Button asChild variant="outline" size="lg">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
