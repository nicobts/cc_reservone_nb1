"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreVertical, Store, MapPin, Phone, Mail } from "lucide-react"

export default function RestaurantsPage() {
  // Mock data - will be replaced with real API call
  const restaurants = [
    {
      id: "1",
      name: "The Italian Corner",
      slug: "the-italian-corner",
      description: "Authentic Italian cuisine in the heart of the city",
      email: "contact@italiancorner.com",
      phone: "+1 234 567 8900",
      address: "123 Main Street",
      city: "New York",
      country: "USA",
      logo: null,
      isActive: true,
      isVerified: true,
      maxCapacity: 100,
    },
    {
      id: "2",
      name: "Sushi Paradise",
      slug: "sushi-paradise",
      description: "Fresh sushi and Japanese delights",
      email: "info@sushiparadise.com",
      phone: "+1 234 567 8901",
      address: "456 Ocean Drive",
      city: "Los Angeles",
      country: "USA",
      logo: null,
      isActive: true,
      isVerified: false,
      maxCapacity: 60,
    },
  ]

  const [searchQuery, setSearchQuery] = useState("")

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurants</h1>
          <p className="text-muted-foreground">Manage your restaurant profiles</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/restaurants/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Restaurant
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search restaurants..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredRestaurants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No restaurants found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by adding your first restaurant"}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/dashboard/restaurants/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Restaurant
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                {restaurant.logo ? (
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Store className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {restaurant.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/restaurants/${restaurant.id}`}>
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/restaurants/${restaurant.id}/edit`}>
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/restaurants/${restaurant.id}/settings`}>
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant={restaurant.isActive ? "default" : "secondary"}>
                    {restaurant.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {restaurant.isVerified && (
                    <Badge variant="success">Verified</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {restaurant.address}, {restaurant.city}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{restaurant.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{restaurant.email}</span>
                </div>
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/restaurants/${restaurant.id}`}>
                      Manage Restaurant
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
