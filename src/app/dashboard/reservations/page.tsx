"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { orpcClient } from "@/lib/orpc-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Search, MoreVertical, Calendar, Loader2, Users, Clock } from "lucide-react"
import { toast } from "sonner"
import { formatDateTime } from "@/lib/utils"

type ReservationStatus = "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show"

const statusColors: Record<ReservationStatus, string> = {
  pending: "secondary",
  confirmed: "default",
  seated: "success",
  completed: "success",
  cancelled: "destructive",
  no_show: "destructive",
}

export default function ReservationsPage() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0] || ""
  )
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedReservation, setSelectedReservation] = useState<any>(null)
  const queryClient = useQueryClient()

  // Fetch restaurants
  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => await orpcClient.restaurant.getMyRestaurants(),
  })

  // Fetch reservations
  const { data: reservations, isLoading } = useQuery({
    queryKey: ["reservations", selectedRestaurant, selectedDate, statusFilter],
    queryFn: async () => {
      if (!selectedRestaurant) return []
      return await orpcClient.reservation.getRestaurantReservations({
        restaurantId: selectedRestaurant,
        date: selectedDate ? new Date(selectedDate) : undefined,
        status: statusFilter !== "all" ? (statusFilter as ReservationStatus) : undefined,
      })
    },
    enabled: !!selectedRestaurant,
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReservationStatus }) => {
      return await orpcClient.reservation.updateStatus({
        id,
        data: { status },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] })
      toast.success("Reservation status updated!")
      setSelectedReservation(null)
    },
    onError: () => {
      toast.error("Failed to update reservation status")
    },
  })

  // Set first restaurant as selected by default
  if (restaurants && restaurants.length > 0 && !selectedRestaurant) {
    setSelectedRestaurant(restaurants[0]!.id)
  }

  // Filter reservations by search query
  const filteredReservations =
    reservations?.filter(
      (reservation) =>
        reservation.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.guestEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.guestPhone.includes(searchQuery)
    ) || []

  const getStatusBadgeVariant = (status: string) => {
    return statusColors[status as ReservationStatus] || "secondary"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
          <p className="text-muted-foreground">Manage restaurant reservations and bookings</p>
        </div>
        <Button asChild disabled={!selectedRestaurant}>
          <Link href={`/dashboard/reservations/new?restaurant=${selectedRestaurant}`}>
            <Plus className="mr-2 h-4 w-4" />
            New Reservation
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Select restaurant" />
          </SelectTrigger>
          <SelectContent>
            {restaurants?.map((restaurant) => (
              <SelectItem key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full sm:w-[180px]"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="seated">Seated</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search guests..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      {reservations && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reservations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reservations.filter((r) => r.status === "confirmed").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reservations.filter((r) => r.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reservations.reduce((sum, r) => sum + r.partySize, 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reservations Table */}
      {!selectedRestaurant ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No restaurant selected</h3>
            <p className="text-muted-foreground text-center mb-4">
              Please select a restaurant to view reservations
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reservations found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery
                ? "Try adjusting your search query"
                : "No reservations for the selected date"}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href={`/dashboard/reservations/new?restaurant=${selectedRestaurant}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Reservation
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Reservations</CardTitle>
            <CardDescription>
              {filteredReservations.length} reservation
              {filteredReservations.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Party Size</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">
                      {new Date(reservation.reservationDate).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reservation.guestName}</div>
                        <div className="text-sm text-muted-foreground">
                          {reservation.guestPhone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {reservation.partySize}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reservation.table?.name || "Not assigned"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(reservation.status) as any}>
                        {reservation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedReservation(reservation)}>
                            View Details
                          </DropdownMenuItem>
                          {reservation.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: reservation.id,
                                  status: "confirmed",
                                })
                              }
                            >
                              Confirm
                            </DropdownMenuItem>
                          )}
                          {reservation.status === "confirmed" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: reservation.id,
                                  status: "seated",
                                })
                              }
                            >
                              Mark as Seated
                            </DropdownMenuItem>
                          )}
                          {reservation.status === "seated" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: reservation.id,
                                  status: "completed",
                                })
                              }
                            >
                              Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm("Cancel this reservation?")) {
                                updateStatusMutation.mutate({
                                  id: reservation.id,
                                  status: "cancelled",
                                })
                              }
                            }}
                          >
                            Cancel Reservation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Reservation Details Dialog */}
      <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
            <DialogDescription>
              Booking for {selectedReservation?.guestName}
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-1">Guest Information</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Name:</span> {selectedReservation.guestName}</p>
                    <p><span className="text-muted-foreground">Email:</span> {selectedReservation.guestEmail}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {selectedReservation.guestPhone}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Reservation Details</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Date & Time:</span> {formatDateTime(new Date(selectedReservation.reservationDate))}</p>
                    <p><span className="text-muted-foreground">Party Size:</span> {selectedReservation.partySize} guests</p>
                    <p><span className="text-muted-foreground">Duration:</span> {selectedReservation.duration} minutes</p>
                    <p><span className="text-muted-foreground">Table:</span> {selectedReservation.table?.name || "Not assigned"}</p>
                  </div>
                </div>
              </div>
              {selectedReservation.specialRequests && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Special Requests</h4>
                  <p className="text-sm text-muted-foreground">{selectedReservation.specialRequests}</p>
                </div>
              )}
              {selectedReservation.dietaryRestrictions && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Dietary Restrictions</h4>
                  <p className="text-sm text-muted-foreground">{selectedReservation.dietaryRestrictions}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedReservation(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // Navigate to edit or perform action
                    toast.info("Edit functionality coming soon!")
                  }}
                >
                  Edit Reservation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
