"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { orpcClient } from "@/lib/orpc-client"
import { createReservationSchema } from "@/types"
import type { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Calendar, Clock, Users, MapPin, Phone, Mail, Loader2, Store } from "lucide-react"
import Link from "next/link"
import { ChatbotWidget } from "@/components/chatbot-widget"

type CreateReservationFormValues = z.infer<typeof createReservationSchema>

export default function BookingPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [partySize, setPartySize] = useState(2)

  // Fetch restaurant by slug
  const { data: restaurant, isLoading: isLoadingRestaurant } = useQuery({
    queryKey: ["restaurant", params.slug],
    queryFn: async () => {
      return await orpcClient.restaurant.getBySlug({ slug: params.slug })
    },
  })

  // Fetch available time slots based on selected date and party size
  const { data: availableSlots = [], isLoading: isLoadingSlots } = useQuery({
    queryKey: ["availableSlots", restaurant?.id, selectedDate, partySize],
    queryFn: async () => {
      if (!restaurant?.id || !selectedDate) return []

      const [year, month, day] = selectedDate.split("-").map(Number)
      const date = new Date(year!, month! - 1, day!)

      return await orpcClient.reservation.getAvailableSlots({
        restaurantId: restaurant.id,
        date,
        partySize,
      })
    },
    enabled: !!restaurant?.id && !!selectedDate,
  })

  const form = useForm<CreateReservationFormValues>({
    resolver: zodResolver(createReservationSchema),
    defaultValues: {
      restaurantId: restaurant?.id || "",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      partySize: 2,
      specialRequests: "",
      dietaryRestrictions: "",
      occasion: "",
    },
  })

  // Update restaurantId when restaurant data loads
  if (restaurant && !form.getValues("restaurantId")) {
    form.setValue("restaurantId", restaurant.id)
  }

  const createMutation = useMutation({
    mutationFn: async (values: CreateReservationFormValues) => {
      return await orpcClient.reservation.create(values)
    },
    onSuccess: async (data) => {
      toast.success("Reservation created successfully!")

      // Check if deposit payment is required
      try {
        const checkoutSession = await orpcClient.payment.createCheckoutSession({
          reservationId: data.id,
        })

        // Redirect to Stripe checkout
        window.location.href = checkoutSession.url
      } catch (error: any) {
        // If no deposit required or error, go to confirmation page
        if (error?.message?.includes("No deposit required")) {
          router.push(`/book/confirmation?id=${data.id}`)
        } else {
          console.error("Payment checkout error:", error)
          // Still go to confirmation even if payment setup fails
          router.push(`/book/confirmation?id=${data.id}`)
        }
      }
    },
    onError: (error) => {
      console.error("Failed to create reservation:", error)
      toast.error("Failed to create reservation. Please try again.")
    },
  })

  async function onSubmit(values: CreateReservationFormValues) {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time")
      return
    }

    // Combine date and time
    const [year, month, day] = selectedDate.split("-").map(Number)
    const [hours, minutes] = selectedTime.split(":").map(Number)
    const reservationDate = new Date(year!, month! - 1, day, hours, minutes)

    const reservationData = {
      ...values,
      reservationDate,
    }

    createMutation.mutate(reservationData)
  }

  // Format time slots for display
  const formatTimeSlots = (slots: string[]) => {
    return slots.map((slot) => {
      const [hour, minute] = slot.split(":").map(Number)
      const displayTime = new Date(2000, 0, 1, hour!, minute!).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
      return { value: slot, label: displayTime }
    })
  }

  const timeSlots = formatTimeSlots(availableSlots)

  // Reset selected time when date or party size changes
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate)
    setSelectedTime("") // Reset time selection
  }

  const handlePartySizeChange = (newSize: number) => {
    setPartySize(newSize)
    setSelectedTime("") // Reset time selection
  }

  // Get minimum date (today)
  const minDate = new Date().toISOString().split("T")[0]

  if (isLoadingRestaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Restaurant not found</h3>
            <p className="text-muted-foreground text-center mb-4">
              The restaurant you're looking for doesn't exist or is no longer available.
            </p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Restaurant Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{restaurant.name}</h1>
          <p className="text-lg text-muted-foreground">{restaurant.description}</p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {restaurant.city}, {restaurant.country}
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {restaurant.phone}
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle>Make a Reservation</CardTitle>
            <CardDescription>Fill in your details to book a table</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Date and Time Selection */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        min={minDate}
                        className="pl-8"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <Select
                      value={selectedTime}
                      onValueChange={setSelectedTime}
                      required
                      disabled={!selectedDate || isLoadingSlots || timeSlots.length === 0}
                    >
                      <SelectTrigger>
                        <Clock className="h-4 w-4 mr-2" />
                        <SelectValue
                          placeholder={
                            !selectedDate
                              ? "Select date first"
                              : isLoadingSlots
                                ? "Loading slots..."
                                : timeSlots.length === 0
                                  ? "No slots available"
                                  : "Select time"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedDate && !isLoadingSlots && timeSlots.length === 0 && (
                      <p className="text-sm text-destructive">
                        No tables available for {partySize} {partySize === 1 ? "guest" : "guests"} on this date. Try a different date or party size.
                      </p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="partySize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Party Size</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const numValue = Number(value)
                            field.onChange(numValue)
                            handlePartySizeChange(numValue)
                          }}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <Users className="h-4 w-4 mr-2" />
                              <SelectValue placeholder="Select guests" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? "Guest" : "Guests"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Guest Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="guestName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John Doe"
                              {...field}
                              disabled={createMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guestEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@example.com"
                              {...field}
                              disabled={createMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="guestPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 234 567 8900"
                            {...field}
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Details (Optional)</h3>

                  <FormField
                    control={form.control}
                    name="occasion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occasion</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select occasion" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No special occasion</SelectItem>
                            <SelectItem value="birthday">Birthday</SelectItem>
                            <SelectItem value="anniversary">Anniversary</SelectItem>
                            <SelectItem value="business">Business Meal</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="celebration">Celebration</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialRequests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Requests</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any special requests? (e.g., window seat, high chair)"
                            {...field}
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dietaryRestrictions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dietary Restrictions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any allergies or dietary restrictions?"
                            {...field}
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} size="lg">
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Confirm Reservation
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Restaurant Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {restaurant.address}, {restaurant.city}, {restaurant.postalCode}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{restaurant.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{restaurant.email}</span>
            </div>
            {restaurant.website && (
              <div className="flex items-center gap-2 text-sm">
                <Store className="h-4 w-4 text-muted-foreground" />
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Visit Website
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chatbot Widget */}
      {restaurant && <ChatbotWidget restaurantId={restaurant.id} restaurantName={restaurant.name} />}
    </div>
  )
}
