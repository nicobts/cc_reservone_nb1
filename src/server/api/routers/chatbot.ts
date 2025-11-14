import { z } from "zod"
import { eq, and, desc } from "drizzle-orm"
import { ORPCError, oc } from "@orpc/server"
import { publicProcedure, protectedProcedure } from "../router"
import {
  chatbotConversations,
  chatbotMessages,
  chatbotKnowledge,
  restaurants,
  restaurantSettings,
} from "@/db/schema"

// OpenAI integration types
interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface FunctionCall {
  name: string
  arguments: Record<string, any>
  result?: any
}

/**
 * Generate AI response using OpenAI API
 * Note: In production, you would use the actual OpenAI API
 * For now, this is a placeholder that simulates AI responses
 */
async function generateAIResponse(params: {
  messages: ChatMessage[]
  restaurantContext: any
  knowledgeBase: any[]
  availableFunctions: string[]
}): Promise<{
  content: string
  functionCalls?: FunctionCall[]
  tokensUsed: { prompt: number; completion: number; total: number }
}> {
  const { messages, restaurantContext, knowledgeBase } = params

  // Build system prompt with restaurant context
  const systemPrompt = `You are a helpful reservation assistant for ${restaurantContext.name}.

Restaurant Details:
- Cuisine: ${restaurantContext.cuisineType || "Various"}
- Location: ${restaurantContext.address}, ${restaurantContext.city}
- Phone: ${restaurantContext.phone}
${restaurantContext.description ? `- About: ${restaurantContext.description}` : ""}

${restaurantContext.settings?.chatbotGreeting || "Hello! How can I help you today?"}

Your role:
1. Answer questions about the restaurant
2. Help guests make reservations
3. Provide information about policies and menu
4. Be friendly, professional, and concise

Available Functions:
- checkAvailability: Check if tables are available for a specific date/time/party size
- createReservation: Create a new reservation
- getRestaurantInfo: Get detailed restaurant information

Knowledge Base:
${knowledgeBase.map((kb) => `Q: ${kb.question}\nA: ${kb.answer}`).join("\n\n")}

Important: If a guest wants to make a reservation, ask for:
1. Date and time
2. Party size (number of guests)
3. Name and contact information (email or phone)

Then use the checkAvailability function to verify availability before creating the reservation.`

  // In production, this would call OpenAI's API:
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [
  //     { role: "system", content: systemPrompt },
  //     ...messages
  //   ],
  //   functions: [...],
  //   temperature: 0.7,
  // })

  // For now, return a simulated response
  const lastMessage = messages[messages.length - 1]
  const userMessage = lastMessage.content.toLowerCase()

  let response = ""
  const functionCalls: FunctionCall[] = []

  // Simple pattern matching for common queries
  if (
    userMessage.includes("hours") ||
    userMessage.includes("open") ||
    userMessage.includes("when")
  ) {
    response = `We're open ${restaurantContext.operatingHours?.[0]?.openTime || "11:00"} to ${restaurantContext.operatingHours?.[0]?.closeTime || "22:00"}. Would you like to make a reservation?`
  } else if (
    userMessage.includes("reserve") ||
    userMessage.includes("book") ||
    userMessage.includes("table")
  ) {
    response =
      "I'd be happy to help you make a reservation! Could you please tell me:\n1. What date would you like to dine with us?\n2. What time works best for you?\n3. How many guests will be joining you?"
  } else if (userMessage.includes("menu") || userMessage.includes("food")) {
    response = `We serve delicious ${restaurantContext.cuisineType || "cuisine"}! For our full menu and current offerings, please visit our restaurant or give us a call at ${restaurantContext.phone}.`
  } else if (
    userMessage.includes("location") ||
    userMessage.includes("address") ||
    userMessage.includes("where")
  ) {
    response = `We're located at ${restaurantContext.address}, ${restaurantContext.city}. Looking forward to seeing you!`
  } else if (userMessage.includes("cancel")) {
    response =
      "To cancel a reservation, please use the cancellation link in your confirmation email, or contact us directly. Our cancellation policy requires at least 24 hours notice."
  } else {
    response = `Thank you for your message! ${restaurantContext.settings?.chatbotGreeting || "How can I help you today?"} You can ask about our hours, make a reservation, or inquire about our menu and location.`
  }

  return {
    content: response,
    functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    tokensUsed: {
      prompt: 150,
      completion: 50,
      total: 200,
    },
  }
}

export const chatbotRouter = oc
  .tag("Chatbot")
  .route({
    // Start a new conversation
    startConversation: publicProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          sessionId: z.string().optional(),
          channel: z.enum(["web", "whatsapp", "telegram", "sms"]).default("web"),
          userAgent: z.string().optional(),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        // Check if restaurant has chatbot enabled
        const restaurant = await context.db.query.restaurants.findFirst({
          where: eq(restaurants.id, input.restaurantId),
          with: {
            settings: true,
          },
        })

        if (!restaurant) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found",
          })
        }

        if (!restaurant.settings?.enableAIChatbot) {
          throw new ORPCError({
            code: "FORBIDDEN",
            message: "Chatbot is not enabled for this restaurant",
          })
        }

        // Create or get existing conversation
        const sessionId = input.sessionId || crypto.randomUUID()

        let conversation = await context.db.query.chatbotConversations.findFirst({
          where: and(
            eq(chatbotConversations.restaurantId, input.restaurantId),
            eq(chatbotConversations.sessionId, sessionId)
          ),
        })

        if (!conversation) {
          const [newConversation] = await context.db
            .insert(chatbotConversations)
            .values({
              restaurantId: input.restaurantId,
              sessionId,
              channel: input.channel,
              userAgent: input.userAgent,
              status: "active",
            })
            .returning()

          conversation = newConversation!

          // Send initial greeting message
          const greeting =
            restaurant.settings.chatbotGreeting ||
            `Welcome to ${restaurant.name}! How can I help you today?`

          await context.db.insert(chatbotMessages).values({
            conversationId: conversation.id,
            role: "assistant",
            content: greeting,
          })
        }

        // Get conversation with messages
        const conversationWithMessages = await context.db.query.chatbotConversations.findFirst({
          where: eq(chatbotConversations.id, conversation.id),
          with: {
            messages: {
              orderBy: [chatbotMessages.createdAt],
            },
          },
        })

        return conversationWithMessages
      }),

    // Send a message and get AI response
    sendMessage: publicProcedure
      .input(
        z.object({
          conversationId: z.string().uuid(),
          message: z.string().min(1).max(1000),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        // Get conversation with restaurant context
        const conversation = await context.db.query.chatbotConversations.findFirst({
          where: eq(chatbotConversations.id, input.conversationId),
          with: {
            restaurant: {
              with: {
                settings: true,
                operatingHours: true,
              },
            },
            messages: {
              orderBy: [chatbotMessages.createdAt],
              limit: 20, // Last 20 messages for context
            },
          },
        })

        if (!conversation) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          })
        }

        if (conversation.status !== "active") {
          throw new ORPCError({
            code: "BAD_REQUEST",
            message: "Conversation is not active",
          })
        }

        // Save user message
        await context.db.insert(chatbotMessages).values({
          conversationId: conversation.id,
          role: "user",
          content: input.message,
        })

        // Get knowledge base for this restaurant
        const knowledgeBase = await context.db.query.chatbotKnowledge.findMany({
          where: eq(chatbotKnowledge.restaurantId, conversation.restaurantId),
          orderBy: [desc(chatbotKnowledge.priority)],
          limit: 10,
        })

        // Build message history
        const messageHistory: ChatMessage[] = conversation.messages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))

        // Add new user message
        messageHistory.push({
          role: "user",
          content: input.message,
        })

        // Generate AI response
        const aiResponse = await generateAIResponse({
          messages: messageHistory,
          restaurantContext: conversation.restaurant,
          knowledgeBase,
          availableFunctions: ["checkAvailability", "createReservation", "getRestaurantInfo"],
        })

        // Save assistant message
        const [assistantMessage] = await context.db
          .insert(chatbotMessages)
          .values({
            conversationId: conversation.id,
            role: "assistant",
            content: aiResponse.content,
            aiModel: "gpt-3.5-turbo", // Would be from actual API
            promptTokens: aiResponse.tokensUsed.prompt,
            completionTokens: aiResponse.tokensUsed.completion,
            totalTokens: aiResponse.tokensUsed.total,
            functionCalls: aiResponse.functionCalls,
          })
          .returning()

        // Update conversation
        await context.db
          .update(chatbotConversations)
          .set({
            messageCount: conversation.messageCount + 2,
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(chatbotConversations.id, conversation.id))

        return {
          message: assistantMessage,
          functionCalls: aiResponse.functionCalls,
        }
      }),

    // Get conversation history
    getConversation: publicProcedure
      .input(z.object({ conversationId: z.string().uuid() }))
      .output(z.any())
      .func(async ({ input, context }) => {
        const conversation = await context.db.query.chatbotConversations.findFirst({
          where: eq(chatbotConversations.id, input.conversationId),
          with: {
            messages: {
              orderBy: [chatbotMessages.createdAt],
            },
            restaurant: true,
          },
        })

        if (!conversation) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          })
        }

        return conversation
      }),

    // End conversation
    endConversation: publicProcedure
      .input(z.object({ conversationId: z.string().uuid() }))
      .output(z.object({ success: z.boolean() }))
      .func(async ({ input, context }) => {
        await context.db
          .update(chatbotConversations)
          .set({
            status: "completed",
            updatedAt: new Date(),
          })
          .where(eq(chatbotConversations.id, input.conversationId))

        return { success: true }
      }),

    // Staff: Manage knowledge base
    addKnowledge: protectedProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          category: z.enum(["faq", "policy", "menu", "special_instructions"]),
          question: z.string(),
          answer: z.string(),
          keywords: z.array(z.string()).optional(),
          priority: z.number().default(0),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        // Verify user has access to restaurant
        const restaurant = await context.db.query.restaurants.findFirst({
          where: eq(restaurants.id, input.restaurantId),
        })

        if (!restaurant) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found",
          })
        }

        if (restaurant.ownerId !== context.user.id) {
          throw new ORPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to manage this restaurant's chatbot",
          })
        }

        const [knowledge] = await context.db
          .insert(chatbotKnowledge)
          .values({
            restaurantId: input.restaurantId,
            category: input.category,
            question: input.question,
            answer: input.answer,
            keywords: input.keywords || [],
            priority: input.priority,
          })
          .returning()

        return knowledge
      }),

    // Staff: Get all knowledge base entries
    getKnowledge: protectedProcedure
      .input(z.object({ restaurantId: z.string().uuid() }))
      .output(z.any())
      .func(async ({ input, context }) => {
        // Verify user has access to restaurant
        const restaurant = await context.db.query.restaurants.findFirst({
          where: eq(restaurants.id, input.restaurantId),
        })

        if (!restaurant) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found",
          })
        }

        if (restaurant.ownerId !== context.user.id) {
          throw new ORPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view this restaurant's chatbot data",
          })
        }

        const knowledge = await context.db.query.chatbotKnowledge.findMany({
          where: eq(chatbotKnowledge.restaurantId, input.restaurantId),
          orderBy: [desc(chatbotKnowledge.priority), desc(chatbotKnowledge.createdAt)],
        })

        return knowledge
      }),

    // Staff: Get conversation analytics
    getConversationStats: protectedProcedure
      .input(
        z.object({
          restaurantId: z.string().uuid(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .output(z.any())
      .func(async ({ input, context }) => {
        // Verify user has access to restaurant
        const restaurant = await context.db.query.restaurants.findFirst({
          where: eq(restaurants.id, input.restaurantId),
        })

        if (!restaurant) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found",
          })
        }

        if (restaurant.ownerId !== context.user.id) {
          throw new ORPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view this restaurant's analytics",
          })
        }

        // Get conversation statistics
        const conversations = await context.db.query.chatbotConversations.findMany({
          where: eq(chatbotConversations.restaurantId, input.restaurantId),
          with: {
            messages: true,
          },
        })

        const stats = {
          totalConversations: conversations.length,
          activeConversations: conversations.filter((c) => c.status === "active").length,
          completedConversations: conversations.filter((c) => c.status === "completed").length,
          totalMessages: conversations.reduce((sum, c) => sum + c.messageCount, 0),
          averageMessagesPerConversation:
            conversations.length > 0
              ? conversations.reduce((sum, c) => sum + c.messageCount, 0) / conversations.length
              : 0,
          conversionsToReservations: conversations.filter((c) => c.reservationId).length,
          conversionRate:
            conversations.length > 0
              ? (conversations.filter((c) => c.reservationId).length / conversations.length) * 100
              : 0,
          channelBreakdown: {
            web: conversations.filter((c) => c.channel === "web").length,
            whatsapp: conversations.filter((c) => c.channel === "whatsapp").length,
            telegram: conversations.filter((c) => c.channel === "telegram").length,
            sms: conversations.filter((c) => c.channel === "sms").length,
          },
        }

        return stats
      }),
  })
