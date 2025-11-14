"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { orpcClient } from "@/lib/orpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, MapPin, UtensilsCrossed, Loader2, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function RestaurantsPage() {
  const [search, setSearch] = useState("")
  const [cuisine, setCuisine] = useState<string>("")
  const [city, setCity] = useState<string>("")
  const [page, setPage] = useState(0)
  const limit = 12

  const { data, isLoading } = useQuery({
    queryKey: ["restaurants", search, cuisine, city, page],
    queryFn: async () => {
      return await orpcClient.restaurant.list({
        search: search || undefined,
        cuisine: cuisine || undefined,
        city: city || undefined,
        limit,
        offset: page * limit,
      })
    },
  })

  const restaurants = data?.restaurants || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(0) // Reset to first page on search
  }

  const handleCuisineChange = (value: string) => {
    setCuisine(value === "all" ? "" : value)
    setPage(0)
  }

  const handleCityChange = (value: string) => {
    setCity(value === "all" ? "" : value)
    setPage(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Discover Amazing Restaurants
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Book your table at the best restaurants in town. Simple, fast, and convenient.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mt-8 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Search Input */}
                  <div className="md:col-span-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search restaurants by name or description..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Cuisine Filter */}
                  <div>
                    <Select value={cuisine || "all"} onValueChange={handleCuisineChange}>
                      <SelectTrigger>
                        <UtensilsCrossed className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="All Cuisines" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cuisines</SelectItem>
                        <SelectItem value="italian">Italian</SelectItem>
                        <SelectItem value="japanese">Japanese</SelectItem>
                        <SelectItem value="chinese">Chinese</SelectItem>
                        <SelectItem value="mexican">Mexican</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                        <SelectItem value="indian">Indian</SelectItem>
                        <SelectItem value="thai">Thai</SelectItem>
                        <SelectItem value="american">American</SelectItem>
                        <SelectItem value="mediterranean">Mediterranean</SelectItem>
                        <SelectItem value="seafood">Seafood</SelectItem>
                        <SelectItem value="steakhouse">Steakhouse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City Filter */}
                  <div>
                    <Select value={city || "all"} onValueChange={handleCityChange}>
                      <SelectTrigger>
                        <MapPin className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="All Cities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        <SelectItem value="new york">New York</SelectItem>
                        <SelectItem value="los angeles">Los Angeles</SelectItem>
                        <SelectItem value="chicago">Chicago</SelectItem>
                        <SelectItem value="san francisco">San Francisco</SelectItem>
                        <SelectItem value="miami">Miami</SelectItem>
                        <SelectItem value="boston">Boston</SelectItem>
                        <SelectItem value="seattle">Seattle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Filters */}
                  {(search || cuisine || city) && (
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearch("")
                          setCuisine("")
                          setCity("")
                          setPage(0)
                        }}
                        className="w-full"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Restaurant Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : restaurants.length === 0 ? (
          <Card className="py-20">
            <CardContent className="text-center">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No restaurants found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("")
                  setCuisine("")
                  setCity("")
                  setPage(0)
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-muted-foreground">
                Found {total} {total === 1 ? "restaurant" : "restaurants"}
                {(search || cuisine || city) && " matching your criteria"}
              </p>
            </div>

            {/* Restaurant Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant: any) => (
                <Link key={restaurant.id} href={`/book/${restaurant.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-primary transition-colors">
                            {restaurant.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {restaurant.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {restaurant.cuisineType && (
                          <Badge variant="secondary" className="capitalize">
                            <UtensilsCrossed className="h-3 w-3 mr-1" />
                            {restaurant.cuisineType}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          <MapPin className="h-3 w-3 mr-1" />
                          {restaurant.city}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {restaurant.address}, {restaurant.city}
                          </span>
                        </div>
                        {restaurant.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs">📞</span>
                            <span>{restaurant.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                        <span>Book a table</span>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNum === 0 ||
                      pageNum === totalPages - 1 ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum + 1}
                        </Button>
                      )
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return (
                        <span key={pageNum} className="px-2">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
