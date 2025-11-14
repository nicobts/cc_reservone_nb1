import { z } from "zod"

// User types
export type UserRole = "owner" | "manager" | "staff" | "customer"

export const userRoles: UserRole[] = ["owner", "manager", "staff", "customer"]

// Reservation types
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show"

export type ReservationSource =
  | "website"
  | "phone"
  | "walk_in"
  | "whatsapp"
  | "telegram"
  | "chatbot"

// Payment types
export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded"

export type PaymentMethod = "card" | "bank_transfer" | "cash" | "other"

// Table types
export type TableShape = "round" | "square" | "rectangle"
export type TableLocation = "indoor" | "outdoor" | "patio" | "bar" | "private_room"

// Notification types
export type NotificationType =
  | "reservation_confirmation"
  | "reservation_reminder"
  | "reservation_cancelled"
  | "reservation_modified"
  | "payment_received"
  | "payment_failed"

export type NotificationChannel = "email" | "sms" | "whatsapp" | "telegram" | "push"
export type NotificationStatus = "pending" | "sent" | "failed" | "delivered" | "read"

// Validation schemas
export const createReservationSchema = z.object({
  restaurantId: z.string().uuid(),
  guestName: z.string().min(2, "Name must be at least 2 characters"),
  guestEmail: z.string().email("Invalid email address"),
  guestPhone: z.string().min(10, "Invalid phone number"),
  reservationDate: z.date().min(new Date(), "Date must be in the future"),
  partySize: z.number().min(1).max(50),
  specialRequests: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  occasion: z.string().optional(),
})

export const createRestaurantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Invalid phone number"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  maxCapacity: z.number().min(1, "Capacity must be at least 1"),
  timezone: z.string().default("UTC"),
  currency: z.string().default("USD"),
})

export const createTableSchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().min(1, "Table name is required"),
  number: z.number().min(1),
  minCapacity: z.number().min(1),
  maxCapacity: z.number().min(1),
  shape: z.enum(["round", "square", "rectangle"]).optional(),
  location: z.enum(["indoor", "outdoor", "patio", "bar", "private_room"]).optional(),
  notes: z.string().optional(),
})

export const updateReservationStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "seated", "completed", "cancelled", "no_show"]),
  internalNotes: z.string().optional(),
})

// API response types
export type ApiResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
  details?: unknown
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Dashboard stats type
export type DashboardStats = {
  todayReservations: number
  upcomingReservations: number
  completedReservations: number
  cancelledReservations: number
  totalRevenue: number
  averagePartySize: number
}
