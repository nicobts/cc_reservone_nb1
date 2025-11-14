"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { orpcClient } from "@/lib/orpc-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  Loader2,
  ChartBar,
} from "lucide-react"

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"]

export default function AnalyticsPage() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("")
  const [dateRange, setDateRange] = useState("30")

  // Fetch user's restaurants
  const { data: restaurants = [], isLoading: isLoadingRestaurants } = useQuery({
    queryKey: ["myRestaurants"],
    queryFn: async () => {
      return await orpcClient.restaurant.getMyRestaurants()
    },
  })

  // Auto-select first restaurant
  if (restaurants.length > 0 && !selectedRestaurant) {
    setSelectedRestaurant(restaurants[0].id)
  }

  // Calculate date range
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - Number.parseInt(dateRange))

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["dashboardStats", selectedRestaurant, startDate, endDate],
    queryFn: async () => {
      return await orpcClient.analytics.getDashboardStats({
        restaurantId: selectedRestaurant,
        startDate,
        endDate,
      })
    },
    enabled: !!selectedRestaurant,
  })

  // Fetch reservations trend
  const { data: reservationsTrend = [] } = useQuery({
    queryKey: ["reservationsTrend", selectedRestaurant, startDate, endDate],
    queryFn: async () => {
      return await orpcClient.analytics.getReservationsTrend({
        restaurantId: selectedRestaurant,
        startDate,
        endDate,
      })
    },
    enabled: !!selectedRestaurant,
  })

  // Fetch revenue trend
  const { data: revenueTrend = [] } = useQuery({
    queryKey: ["revenueTrend", selectedRestaurant, startDate, endDate],
    queryFn: async () => {
      return await orpcClient.analytics.getRevenueTrend({
        restaurantId: selectedRestaurant,
        startDate,
        endDate,
      })
    },
    enabled: !!selectedRestaurant,
  })

  // Fetch popular times
  const { data: popularTimes } = useQuery({
    queryKey: ["popularTimes", selectedRestaurant, startDate, endDate],
    queryFn: async () => {
      return await orpcClient.analytics.getPopularTimes({
        restaurantId: selectedRestaurant,
        startDate,
        endDate,
      })
    },
    enabled: !!selectedRestaurant,
  })

  // Fetch top customers
  const { data: topCustomers = [] } = useQuery({
    queryKey: ["topCustomers", selectedRestaurant],
    queryFn: async () => {
      return await orpcClient.analytics.getTopCustomers({
        restaurantId: selectedRestaurant,
        limit: 10,
      })
    },
    enabled: !!selectedRestaurant,
  })

  if (isLoadingRestaurants) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (restaurants.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <ChartBar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Restaurants Found</h3>
            <p className="text-muted-foreground">
              Create a restaurant first to view analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const dayOfWeekData = popularTimes?.byDayOfWeek?.map((item: any) => ({
    day: dayNames[item.dayOfWeek],
    bookings: item.count,
  })) || []

  const hourlyData = popularTimes?.byHour?.map((item: any) => ({
    hour: `${item.hour}:00`,
    bookings: item.count,
  })) || []

  const statusData = stats?.reservationsByStatus?.map((item: any) => ({
    name: item.status,
    value: item.count,
  })) || []

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your restaurant's performance</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select restaurant" />
          </SelectTrigger>
          <SelectContent>
            {restaurants.map((restaurant: any) => (
              <SelectItem key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoadingStats ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalReservations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Last {dateRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${((stats?.revenue?.total || 0) / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {stats?.revenue?.paidReservations || 0} paid bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Party Size</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.metrics?.averagePartySize || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  guests per reservation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
                {stats?.metrics?.noShowRate > 10 ? (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.metrics?.noShowRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.metrics?.noShowRate > 10 ? "Above average" : "Good performance"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reservations Over Time</CardTitle>
                <CardDescription>Daily booking trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reservationsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      name="Reservations"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>Daily revenue from deposits</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis tickFormatter={(value) => `$${(value / 100).toFixed(0)}`} />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      formatter={(value: any) => [`$${(value / 100).toFixed(2)}`, "Revenue"]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      name="Revenue"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Popular Booking Times</CardTitle>
                <CardDescription>Bookings by hour of day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill="#8b5cf6" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bookings by Day of Week</CardTitle>
                <CardDescription>Weekly distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill="#ec4899" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 3 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reservation Status</CardTitle>
                <CardDescription>Distribution by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Most frequent diners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCustomers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No customer data yet
                    </p>
                  ) : (
                    topCustomers.map((customer: any, index: number) => (
                      <div key={customer.guestEmail} className="flex items-center gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {customer.guestName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {customer.guestEmail}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          {customer.visitCount} visits
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
