"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { orpcClient } from "@/lib/orpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Clock, Save, Copy, Loader2, Calendar } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const DAYS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
]

type DayHours = {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

export default function OperatingHoursPage() {
  const queryClient = useQueryClient()
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("")
  const [hours, setHours] = useState<DayHours[]>([])
  const [bulkDays, setBulkDays] = useState<number[]>([])

  // Fetch restaurants
  const { data: restaurants = [], isLoading: isLoadingRestaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      return await orpcClient.restaurant.getMyRestaurants()
    },
  })

  // Auto-select first restaurant
  if (restaurants.length > 0 && !selectedRestaurant) {
    setSelectedRestaurant(restaurants[0].id)
  }

  // Fetch operating hours
  const { data: operatingHours, isLoading: isLoadingHours } = useQuery({
    queryKey: ["operatingHours", selectedRestaurant],
    queryFn: async () => {
      if (!selectedRestaurant) return []
      const result = await orpcClient.operatingHours.getRestaurantHours({
        restaurantId: selectedRestaurant,
      })
      return result
    },
    enabled: !!selectedRestaurant,
  })

  // Set hours when data loads
  if (operatingHours && hours.length === 0) {
    setHours(
      operatingHours.map((h: any) => ({
        dayOfWeek: h.dayOfWeek,
        openTime: h.openTime,
        closeTime: h.closeTime,
        isClosed: h.isClosed,
      }))
    )
  }

  // Update hours mutation
  const updateMutation = useMutation({
    mutationFn: async (hoursData: DayHours[]) => {
      return await orpcClient.operatingHours.updateHours({
        restaurantId: selectedRestaurant,
        hours: hoursData,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operatingHours", selectedRestaurant] })
      toast.success("Operating hours updated successfully!")
    },
    onError: (error) => {
      console.error("Failed to update hours:", error)
      toast.error("Failed to update operating hours")
    },
  })

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: {
      days: number[]
      openTime: string
      closeTime: string
      isClosed: boolean
    }) => {
      return await orpcClient.operatingHours.bulkUpdate({
        restaurantId: selectedRestaurant,
        ...data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operatingHours", selectedRestaurant] })
      setBulkDays([])
      toast.success("Bulk update applied successfully!")
    },
    onError: (error) => {
      console.error("Failed to bulk update:", error)
      toast.error("Failed to apply bulk update")
    },
  })

  const handleDayChange = (dayOfWeek: number, field: keyof DayHours, value: any) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    )
  }

  const handleSave = () => {
    updateMutation.mutate(hours)
  }

  const handleBulkUpdate = () => {
    if (bulkDays.length === 0) {
      toast.error("Please select at least one day")
      return
    }

    // Get the hours from the first selected day
    const firstDay = hours.find((h) => h.dayOfWeek === bulkDays[0])
    if (!firstDay) return

    bulkUpdateMutation.mutate({
      days: bulkDays,
      openTime: firstDay.openTime,
      closeTime: firstDay.closeTime,
      isClosed: firstDay.isClosed,
    })
  }

  const toggleBulkDay = (day: number) => {
    setBulkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const selectWeekdays = () => {
    setBulkDays([1, 2, 3, 4, 5])
  }

  const selectWeekend = () => {
    setBulkDays([0, 6])
  }

  const selectAll = () => {
    setBulkDays([0, 1, 2, 3, 4, 5, 6])
  }

  if (isLoadingRestaurants) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Restaurants Found</h3>
            <p className="text-muted-foreground text-center">
              Create a restaurant first to manage operating hours.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operating Hours</h1>
          <p className="text-muted-foreground">
            Manage your restaurant's opening and closing times
          </p>
        </div>
      </div>

      {/* Restaurant Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Restaurant</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a restaurant" />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map((restaurant: any) => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Update</CardTitle>
          <CardDescription>
            Select multiple days and copy settings from the first selected day
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <Button
                key={day.value}
                variant={bulkDays.includes(day.value) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleBulkDay(day.value)}
              >
                {day.short}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectWeekdays}>
              Weekdays
            </Button>
            <Button variant="outline" size="sm" onClick={selectWeekend}>
              Weekend
            </Button>
            <Button variant="outline" size="sm" onClick={selectAll}>
              All Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkDays([])}>
              Clear
            </Button>
          </div>

          <Button
            onClick={handleBulkUpdate}
            disabled={bulkDays.length === 0 || bulkUpdateMutation.isPending}
          >
            {bulkUpdateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Apply to Selected Days
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Hours Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Set opening and closing times for each day</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHours ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {DAYS.map((day) => {
                const dayHours = hours.find((h) => h.dayOfWeek === day.value)
                if (!dayHours) return null

                return (
                  <div
                    key={day.value}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="w-24 font-medium">{day.label}</div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!dayHours.isClosed}
                        onCheckedChange={(checked) =>
                          handleDayChange(day.value, "isClosed", !checked)
                        }
                      />
                      <Label>{dayHours.isClosed ? "Closed" : "Open"}</Label>
                    </div>

                    {!dayHours.isClosed && (
                      <>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={dayHours.openTime}
                            onChange={(e) =>
                              handleDayChange(day.value, "openTime", e.target.value)
                            }
                            className="w-32"
                          />
                        </div>

                        <span className="text-muted-foreground">to</span>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={dayHours.closeTime}
                            onChange={(e) =>
                              handleDayChange(day.value, "closeTime", e.target.value)
                            }
                            className="w-32"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending} size="lg">
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
