// Export all schema tables and relations
export * from "./users"
export * from "./restaurants"
export * from "./tables"
export * from "./reservations"
export * from "./payments"
export * from "./notifications"
export * from "./settings"
export * from "./chatbot"
export * from "./relations"

// Re-export types for easier imports
import { users, sessions, accounts, verificationTokens } from "./users"
import { restaurants, restaurantStaff, operatingHours } from "./restaurants"
import { tables } from "./tables"
import { reservations, reservationHistory } from "./reservations"
import { payments } from "./payments"
import { notifications, notificationPreferences } from "./notifications"
import { restaurantSettings } from "./settings"
import { chatbotConversations, chatbotMessages, chatbotKnowledge } from "./chatbot"

export const schema = {
  users,
  sessions,
  accounts,
  verificationTokens,
  restaurants,
  restaurantStaff,
  operatingHours,
  tables,
  reservations,
  reservationHistory,
  payments,
  notifications,
  notificationPreferences,
  restaurantSettings,
  chatbotConversations,
  chatbotMessages,
  chatbotKnowledge,
}
