"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { orpcClient } from "@/lib/orpc-client"
import { createTableSchema } from "@/types"
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
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type CreateTableFormValues = z.infer<typeof createTableSchema>

export default function NewTablePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantId = searchParams.get("restaurant") || ""
  const queryClient = useQueryClient()

  // Fetch restaurants to show name
  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => await orpcClient.restaurant.getMyRestaurants(),
  })

  const selectedRestaurant = restaurants?.find((r) => r.id === restaurantId)

  // Get table count for auto-numbering
  const { data: existingTables } = useQuery({
    queryKey: ["tables", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return []
      return await orpcClient.tables.getRestaurantTables({ restaurantId })
    },
    enabled: !!restaurantId,
  })

  const nextTableNumber = (existingTables?.length || 0) + 1

  const form = useForm<CreateTableFormValues>({
    resolver: zodResolver(createTableSchema),
    defaultValues: {
      restaurantId,
      name: `Table ${nextTableNumber}`,
      number: nextTableNumber,
      minCapacity: 2,
      maxCapacity: 4,
      shape: "rectangle",
      location: "indoor",
      notes: "",
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: CreateTableFormValues) => {
      return await orpcClient.tables.create(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] })
      toast.success("Table created successfully!")
      router.push("/dashboard/tables")
    },
    onError: (error) => {
      console.error("Failed to create table:", error)
      toast.error("Failed to create table. Please try again.")
    },
  })

  async function onSubmit(values: CreateTableFormValues) {
    createMutation.mutate(values)
  }

  if (!restaurantId) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">No restaurant selected</h3>
            <p className="text-muted-foreground text-center mb-4">
              Please select a restaurant from the tables page
            </p>
            <Button asChild>
              <Link href="/dashboard/tables">Go to Tables</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tables">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Table</h1>
          <p className="text-muted-foreground">
            Create a new table for {selectedRestaurant?.name}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Table Information</CardTitle>
              <CardDescription>Basic details about the table</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Table Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Table 1"
                          {...field}
                          disabled={createMutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        Display name for the table
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Table Number</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={createMutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        Numeric identifier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="minCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={createMutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum guests
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={createMutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum guests
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="shape"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Table Shape</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={createMutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shape" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="round">Round</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="rectangle">Rectangle</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={createMutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="indoor">Indoor</SelectItem>
                          <SelectItem value="outdoor">Outdoor</SelectItem>
                          <SelectItem value="patio">Patio</SelectItem>
                          <SelectItem value="bar">Bar</SelectItem>
                          <SelectItem value="private_room">Private Room</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special notes about this table..."
                        {...field}
                        disabled={createMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Internal notes (not visible to customers)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              asChild
              disabled={createMutation.isPending}
            >
              <Link href="/dashboard/tables">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Table"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
