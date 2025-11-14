"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { orpcClient } from "@/lib/orpc-client"
import { createTableSchema } from "@/types"
import type { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { ArrowLeft, Save, Loader2, TableIcon } from "lucide-react"
import Link from "next/link"

// Create update schema (omit restaurantId since we can't change it)
const updateTableSchema = createTableSchema.omit({ restaurantId: true })
type UpdateTableFormValues = z.infer<typeof updateTableSchema>

export default function EditTablePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch table data
  const { data: table, isLoading: isLoadingTable } = useQuery({
    queryKey: ["table", params.id],
    queryFn: async () => {
      return await orpcClient.tables.getById({ id: params.id })
    },
  })

  const form = useForm<UpdateTableFormValues>({
    resolver: zodResolver(updateTableSchema),
    defaultValues: {
      name: table?.name || "",
      number: table?.number || 1,
      minCapacity: table?.minCapacity || 2,
      maxCapacity: table?.maxCapacity || 4,
      shape: table?.shape || "round",
      location: table?.location || "indoor",
      description: table?.description || "",
    },
  })

  // Update form values when table data loads
  if (table && !form.formState.isDirty) {
    form.reset({
      name: table.name,
      number: table.number,
      minCapacity: table.minCapacity,
      maxCapacity: table.maxCapacity,
      shape: table.shape,
      location: table.location,
      description: table.description || "",
    })
  }

  const updateMutation = useMutation({
    mutationFn: async (values: UpdateTableFormValues) => {
      return await orpcClient.tables.update({
        id: params.id,
        data: values,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", params.id] })
      queryClient.invalidateQueries({ queryKey: ["tables"] })
      toast.success("Table updated successfully!")
      router.push("/dashboard/tables")
    },
    onError: (error) => {
      console.error("Failed to update table:", error)
      toast.error("Failed to update table. Please try again.")
    },
  })

  async function onSubmit(values: UpdateTableFormValues) {
    updateMutation.mutate(values)
  }

  if (isLoadingTable) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!table) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TableIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Table Not Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              The table you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link href="/dashboard/tables">Back to Tables</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/tables">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Table</h1>
          <p className="text-muted-foreground">Update table details and configuration</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Table Information</CardTitle>
          <CardDescription>
            Modify the table's details, capacity, and location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          disabled={updateMutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>Display name for this table</FormDescription>
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
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={updateMutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>Unique number identifier</FormDescription>
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
                          min="1"
                          placeholder="2"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={updateMutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>Minimum number of guests</FormDescription>
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
                          min="1"
                          placeholder="4"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={updateMutation.isPending}
                        />
                      </FormControl>
                      <FormDescription>Maximum number of guests</FormDescription>
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
                        disabled={updateMutation.isPending}
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
                        disabled={updateMutation.isPending}
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Window seat with garden view"
                        {...field}
                        disabled={updateMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Additional details about this table's features or location
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/tables")}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Table
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
