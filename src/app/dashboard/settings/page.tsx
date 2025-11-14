"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { orpcClient } from "@/lib/orpc-client"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Save, Loader2, Settings2 } from "lucide-react"

const settingsSchema = z.object({
  advanceBookingDays: z.number().min(1).max(365),
  minAdvanceBookingHours: z.number().min(0).max(168),
  maxPartySize: z.number().min(1).max(100),
  defaultReservationDuration: z.number().min(30).max(480),
  slotInterval: z.number().min(5).max(60),
  autoConfirmReservations: z.boolean(),
  allowCancellation: z.boolean(),
  cancellationDeadlineHours: z.number().min(0).max(168),
  cancellationPolicy: z.string().optional(),
  sendReminderEmail: z.boolean(),
  sendReminderSMS: z.boolean(),
  reminderHoursBefore: z.number().min(1).max(168),
  allowTableSelection: z.boolean(),
  autoAssignTables: z.boolean(),
  enableWaitlist: z.boolean(),
  waitlistAutoExpireMinutes: z.number().min(5).max(120),
  requireDepositForPartySize: z.number().min(1).nullable(),
  depositAmount: z.number().min(0).nullable(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("")

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

  // Fetch settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["settings", selectedRestaurant],
    queryFn: async () => {
      if (!selectedRestaurant) return null
      return await orpcClient.settings.getRestaurantSettings({
        restaurantId: selectedRestaurant,
      })
    },
    enabled: !!selectedRestaurant,
  })

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      advanceBookingDays: 30,
      minAdvanceBookingHours: 2,
      maxPartySize: 12,
      defaultReservationDuration: 120,
      slotInterval: 15,
      autoConfirmReservations: false,
      allowCancellation: true,
      cancellationDeadlineHours: 24,
      cancellationPolicy: "",
      sendReminderEmail: true,
      sendReminderSMS: false,
      reminderHoursBefore: 24,
      allowTableSelection: false,
      autoAssignTables: true,
      enableWaitlist: false,
      waitlistAutoExpireMinutes: 15,
      requireDepositForPartySize: null,
      depositAmount: null,
    },
  })

  // Update form when settings load
  if (settings && !form.formState.isDirty) {
    form.reset({
      advanceBookingDays: settings.advanceBookingDays,
      minAdvanceBookingHours: settings.minAdvanceBookingHours,
      maxPartySize: settings.maxPartySize,
      defaultReservationDuration: settings.defaultReservationDuration,
      slotInterval: settings.slotInterval,
      autoConfirmReservations: settings.autoConfirmReservations,
      allowCancellation: settings.allowCancellation,
      cancellationDeadlineHours: settings.cancellationDeadlineHours ?? 24,
      cancellationPolicy: settings.cancellationPolicy ?? "",
      sendReminderEmail: settings.sendReminderEmail,
      sendReminderSMS: settings.sendReminderSMS,
      reminderHoursBefore: settings.reminderHoursBefore,
      allowTableSelection: settings.allowTableSelection,
      autoAssignTables: settings.autoAssignTables,
      enableWaitlist: settings.enableWaitlist,
      waitlistAutoExpireMinutes: settings.waitlistAutoExpireMinutes ?? 15,
      requireDepositForPartySize: settings.requireDepositForPartySize,
      depositAmount: settings.depositAmount,
    })
  }

  const updateMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      return await orpcClient.settings.updateSettings({
        restaurantId: selectedRestaurant,
        settings: values,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", selectedRestaurant] })
      toast.success("Settings updated successfully!")
    },
    onError: (error) => {
      console.error("Failed to update settings:", error)
      toast.error("Failed to update settings")
    },
  })

  async function onSubmit(values: SettingsFormValues) {
    updateMutation.mutate(values)
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
            <Settings2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Restaurants Found</h3>
            <p className="text-muted-foreground text-center">
              Create a restaurant first to configure settings.
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
          <h1 className="text-3xl font-bold">Restaurant Settings</h1>
          <p className="text-muted-foreground">
            Configure reservation rules and preferences
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

      {isLoadingSettings ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="reservations" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="reservations">Reservations</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="tables">Tables</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>

              <TabsContent value="reservations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Booking Configuration</CardTitle>
                    <CardDescription>
                      Control how customers can book reservations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="advanceBookingDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Advance Booking (Days)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="365"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              How far in advance customers can book
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="minAdvanceBookingHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Notice (Hours)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="168"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum hours before reservation time
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="maxPartySize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Party Size</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum guests per reservation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="defaultReservationDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reservation Duration (Minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="30"
                                max="480"
                                step="15"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Default dining duration
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="slotInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Slot Interval (Minutes)</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => field.onChange(Number(value))}
                              defaultValue={field.value.toString()}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 minutes</SelectItem>
                                <SelectItem value="10">10 minutes</SelectItem>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="60">60 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Time intervals for available booking slots
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="autoConfirmReservations"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Auto-Confirm Reservations
                            </FormLabel>
                            <FormDescription>
                              Automatically confirm new reservations without manual review
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cancellation Policy</CardTitle>
                    <CardDescription>
                      Set rules for reservation cancellations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="allowCancellation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Allow Cancellations</FormLabel>
                            <FormDescription>
                              Let customers cancel their reservations
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("allowCancellation") && (
                      <>
                        <FormField
                          control={form.control}
                          name="cancellationDeadlineHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cancellation Deadline (Hours)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="168"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Hours before reservation that cancellation is allowed
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="cancellationPolicy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cancellation Policy Text</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe your cancellation policy..."
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Shown to customers when booking
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Waitlist</CardTitle>
                    <CardDescription>
                      Manage waitlist for fully booked times
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="enableWaitlist"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Waitlist</FormLabel>
                            <FormDescription>
                              Allow customers to join waitlist when fully booked
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("enableWaitlist") && (
                      <FormField
                        control={form.control}
                        name="waitlistAutoExpireMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Auto-Expire (Minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="5"
                                max="120"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Minutes before waitlist entry expires
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reminder Settings</CardTitle>
                    <CardDescription>
                      Configure automated reminders for guests
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sendReminderEmail"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Reminders</FormLabel>
                            <FormDescription>
                              Send reminder emails to guests
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sendReminderSMS"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">SMS Reminders</FormLabel>
                            <FormDescription>
                              Send reminder SMS messages to guests
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {(form.watch("sendReminderEmail") || form.watch("sendReminderSMS")) && (
                      <FormField
                        control={form.control}
                        name="reminderHoursBefore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Send Reminder (Hours Before)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="168"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Hours before reservation to send reminder
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tables" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Table Management</CardTitle>
                    <CardDescription>
                      Configure how tables are assigned to reservations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="autoAssignTables"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto-Assign Tables</FormLabel>
                            <FormDescription>
                              Automatically assign best available table
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="allowTableSelection"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Allow Table Selection</FormLabel>
                            <FormDescription>
                              Let customers choose their preferred table
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Deposit Requirements</CardTitle>
                    <CardDescription>
                      Require deposits for large parties (optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="requireDepositForPartySize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Require Deposit For Party Size</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              placeholder="Leave empty to disable"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value ? Number(e.target.value) : null)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum party size to require deposit (leave empty to disable)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("requireDepositForPartySize") && (
                      <FormField
                        control={form.control}
                        name="depositAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deposit Amount (in cents)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="e.g., 2000 for $20.00"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value ? Number(e.target.value) : null)
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Fixed deposit amount in cents (e.g., 2000 = $20.00)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending} size="lg">
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
