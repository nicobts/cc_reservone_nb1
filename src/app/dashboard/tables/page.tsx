"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { orpcClient } from "@/lib/orpc-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table as TableComponent,
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
import { Plus, Loader2, MoreVertical, TableIcon, Users } from "lucide-react"
import { toast } from "sonner"

export default function TablesPage() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("")
  const queryClient = useQueryClient()

  // Fetch restaurants
  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => await orpcClient.restaurant.getMyRestaurants(),
  })

  // Fetch tables for selected restaurant
  const { data: tables, isLoading } = useQuery({
    queryKey: ["tables", selectedRestaurant],
    queryFn: async () => {
      if (!selectedRestaurant) return []
      return await orpcClient.tables.getRestaurantTables({ restaurantId: selectedRestaurant })
    },
    enabled: !!selectedRestaurant,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await orpcClient.tables.delete({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables", selectedRestaurant] })
      toast.success("Table deleted successfully!")
    },
    onError: () => {
      toast.error("Failed to delete table")
    },
  })

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await orpcClient.tables.toggleActive({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables", selectedRestaurant] })
      toast.success("Table status updated!")
    },
    onError: () => {
      toast.error("Failed to update table status")
    },
  })

  // Set first restaurant as selected by default
  if (restaurants && restaurants.length > 0 && !selectedRestaurant) {
    setSelectedRestaurant(restaurants[0]!.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tables</h1>
          <p className="text-muted-foreground">Manage your restaurant tables and seating</p>
        </div>
        <Button asChild disabled={!selectedRestaurant}>
          <Link href={`/dashboard/tables/new?restaurant=${selectedRestaurant}`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Table
          </Link>
        </Button>
      </div>

      {/* Restaurant selector */}
      <div className="flex items-center gap-4">
        <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a restaurant" />
          </SelectTrigger>
          <SelectContent>
            {restaurants?.map((restaurant) => (
              <SelectItem key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedRestaurant ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TableIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No restaurant selected</h3>
            <p className="text-muted-foreground text-center mb-4">
              Please select a restaurant to view and manage tables
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !tables || tables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TableIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tables yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first table
            </p>
            <Button asChild>
              <Link href={`/dashboard/tables/new?restaurant=${selectedRestaurant}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Table
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tables</CardTitle>
            <CardDescription>
              {tables.length} table{tables.length !== 1 ? "s" : ""} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TableComponent>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Shape</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {table.minCapacity === table.maxCapacity
                            ? table.maxCapacity
                            : `${table.minCapacity}-${table.maxCapacity}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{table.shape}</TableCell>
                    <TableCell className="capitalize">{table.location?.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge variant={table.isActive ? "default" : "secondary"}>
                        {table.isActive ? "Active" : "Inactive"}
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
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/tables/${table.id}/edit`}>
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleActiveMutation.mutate(table.id)}
                          >
                            {table.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this table?")) {
                                deleteMutation.mutate(table.id)
                              }
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableComponent>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
