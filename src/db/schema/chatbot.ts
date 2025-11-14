import { pgTable, text, timestamp, uuid, integer, json } from "drizzle-orm/pg-core"
import { restaurants } from "./restaurants"

export const chatbotConversations = pgTable("chatbot_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),

  // Session tracking
  sessionId: text("session_id").notNull(), // Unique session identifier for tracking conversations
  guestEmail: text("guest_email"), // Optional - if user provides email
  guestName: text("guest_name"), // Optional - if user provides name
  guestPhone: text("guest_phone"), // Optional - if user provides phone

  // Conversation metadata
  channel: text("channel").notNull().default("web"), // web, whatsapp, telegram, sms
  userAgent: text("user_agent"), // Browser/device info
  ipAddress: text("ip_address"), // For rate limiting

  // Conversation state
  status: text("status").notNull().default("active"), // active, completed, abandoned
  intent: text("intent"), // reservation, inquiry, complaint, general
  detectedLanguage: text("detected_language").default("en"),

  // Booking context (if conversation leads to reservation)
  reservationId: uuid("reservation_id"), // Link to created reservation if any
  proposedDate: timestamp("proposed_date", { mode: "date" }),
  proposedTime: text("proposed_time"),
  proposedPartySize: integer("proposed_party_size"),

  // Conversation summary
  messageCount: integer("message_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at", { mode: "date" }),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})

export const chatbotMessages = pgTable("chatbot_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => chatbotConversations.id, { onDelete: "cascade" }),

  // Message details
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),

  // AI metadata
  aiModel: text("ai_model"), // e.g., "gpt-4", "gpt-3.5-turbo"
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  totalTokens: integer("total_tokens"),

  // Function calling / tool use
  functionCalls: json("function_calls").$type<Array<{
    name: string
    arguments: Record<string, any>
    result?: any
  }>>(),

  // Metadata
  sentiment: text("sentiment"), // positive, neutral, negative
  metadata: json("metadata").$type<Record<string, any>>(),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})

export const chatbotKnowledge = pgTable("chatbot_knowledge", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),

  // Knowledge entry
  category: text("category").notNull(), // faq, policy, menu, special_instructions
  question: text("question").notNull(),
  answer: text("answer").notNull(),

  // Context
  keywords: json("keywords").$type<string[]>().default([]),
  priority: integer("priority").notNull().default(0), // Higher priority = shown first

  // Usage tracking
  timesUsed: integer("times_used").notNull().default(0),
  lastUsedAt: timestamp("last_used_at", { mode: "date" }),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})
