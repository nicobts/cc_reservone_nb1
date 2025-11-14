"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardPage() {
  // Mock data - will be replaced with real data from API
  const stats = [
    {
      title: "Today's Reservations",
      value: "24",
      change: "+12%",
      icon: Calendar,
      trend: "up",
    },
    {
      title: "Total Customers",
      value: "1,234",
      change: "+8%",
      icon: Users,
      trend: "up",
    },
    {
      title: "Revenue (This Month)",
      value: "$12,456",
      change: "+15%",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Occupancy Rate",
      value: "87%",
      change: "+5%",
      icon: TrendingUp,
      trend: "up",
    },
  ]

  const upcomingReservations = [
    {
      id: "1",
      guestName: "John Smith",
      time: "12:00 PM",
      partySize: 4,
      status: "confirmed",
    },
    {
      id: "2",
      guestName: "Sarah Johnson",
      time: "1:30 PM",
      partySize: 2,
      status: "pending",
    },
    {
      id: "3",
      guestName: "Michael Brown",
      time: "7:00 PM",
      partySize: 6,
      status: "confirmed",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/reservations/new">New Reservation</Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>
                    {stat.change}
                  </span>{" "}
                  from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Reservations */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Reservations</CardTitle>
            <CardDescription>Reservations for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingReservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{reservation.guestName}</p>
                      <p className="text-sm text-muted-foreground">
                        {reservation.time} · {reservation.partySize} guests
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={reservation.status === "confirmed" ? "default" : "secondary"}
                  >
                    {reservation.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/dashboard/reservations">View All Reservations</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/reservations/new">
                <Calendar className="mr-2 h-4 w-4" />
                New Reservation
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/restaurants/new">
                <CheckCircle className="mr-2 h-4 w-4" />
                Add Restaurant
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/tables">
                <Users className="mr-2 h-4 w-4" />
                Manage Tables
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your restaurants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">John Smith</span> confirmed their reservation
                </p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">New reservation</span> for tonight at 7:00 PM
                </p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                <DollarSign className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Payment received</span> for reservation #1234
                </p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
