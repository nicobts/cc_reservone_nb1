import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { chatbotConversations, chatbotMessages, restaurants } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { sendWhatsAppMessage } from "@/lib/whatsapp"

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "reservone-webhook"

/**
 * GET handler for webhook verification
 * WhatsApp will call this endpoint to verify the webhook URL
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  // Verify webhook
  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified")
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Invalid verification token" }, { status: 403 })
}

/**
 * POST handler for receiving WhatsApp messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // WhatsApp sends status updates and messages
    // We only care about messages
    if (!body.entry) {
      return NextResponse.json({ success: true })
    }

    for (const entry of body.entry) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue

        const value = change.value
        if (!value.messages) continue

        for (const message of value.messages) {
          await handleIncomingWhatsAppMessage(message, value.metadata)
        }

        // Mark messages as read
        if (value.messages[0]?.id) {
          // Note: markAsRead would go here but we'll skip for now
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("WhatsApp webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Handle incoming WhatsApp message
 */
async function handleIncomingWhatsAppMessage(
  message: any,
  metadata: any
): Promise<void> {
  try {
    const from = message.from // Phone number
    const messageType = message.type
    let messageText = ""

    // Extract message text based on type
    switch (messageType) {
      case "text":
        messageText = message.text?.body || ""
        break
      case "button":
        messageText = message.button?.text || ""
        break
      case "interactive":
        messageText = message.interactive?.button_reply?.title || ""
        break
      default:
        // Unsupported message type
        await sendWhatsAppMessage({
          to: from,
          body: "Sorry, I can only process text messages at the moment.",
        })
        return
    }

    if (!messageText) return

    // Try to find which restaurant this conversation belongs to
    // For now, we'll use a simple approach: check if there's an existing conversation
    // In production, you might want to use phone number mapping or ask the user
    let conversation = await db.query.chatbotConversations.findFirst({
      where: and(
        eq(chatbotConversations.guestPhone, from),
        eq(chatbotConversations.channel, "whatsapp"),
        eq(chatbotConversations.status, "active")
      ),
      orderBy: (conversations, { desc }) => [desc(conversations.lastMessageAt)],
      with: {
        restaurant: {
          with: {
            settings: true,
            operatingHours: true,
          },
        },
      },
    })

    // If no conversation exists, we need to determine the restaurant
    // For this example, we'll take the first restaurant with WhatsApp enabled
    // In production, you'd have a better mapping system
    if (!conversation) {
      const restaurantWithWhatsApp = await db.query.restaurants.findFirst({
        with: {
          settings: true,
          operatingHours: true,
        },
        where: (restaurants, { exists }) =>
          exists(
            db
              .select()
              .from(restaurants)
              .where(eq(restaurants.id, restaurants.id))
          ),
      })

      if (!restaurantWithWhatsApp || !restaurantWithWhatsApp.settings?.enableWhatsApp) {
        // No restaurant configured for WhatsApp
        await sendWhatsAppMessage({
          to: from,
          body: "Thank you for your message. WhatsApp support is not currently active. Please visit our website to make a reservation.",
        })
        return
      }

      // Create new conversation
      const [newConversation] = await db
        .insert(chatbotConversations)
        .values({
          restaurantId: restaurantWithWhatsApp.id,
          sessionId: `whatsapp-${from}-${Date.now()}`,
          guestPhone: from,
          channel: "whatsapp",
          status: "active",
        })
        .returning()

      conversation = {
        ...newConversation,
        restaurant: restaurantWithWhatsApp,
      }

      // Send greeting
      const greeting =
        restaurantWithWhatsApp.settings?.chatbotGreeting ||
        `Welcome to ${restaurantWithWhatsApp.name}! How can I help you today?`

      await sendWhatsAppMessage({
        to: from,
        body: greeting,
      })

      await db.insert(chatbotMessages).values({
        conversationId: conversation.id,
        role: "assistant",
        content: greeting,
      })
    }

    // Save user message
    await db.insert(chatbotMessages).values({
      conversationId: conversation.id,
      role: "user",
      content: messageText,
    })

    // Generate AI response (using the same logic as web chatbot)
    // For simplicity, we'll use pattern matching here
    const response = await generateWhatsAppResponse(messageText, conversation.restaurant)

    // Send response via WhatsApp
    await sendWhatsAppMessage({
      to: from,
      body: response,
    })

    // Save assistant message
    await db.insert(chatbotMessages).values({
      conversationId: conversation.id,
      role: "assistant",
      content: response,
    })

    // Update conversation
    await db
      .update(chatbotConversations)
      .set({
        messageCount: (conversation.messageCount || 0) + 2,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(chatbotConversations.id, conversation.id))
  } catch (error) {
    console.error("Error handling WhatsApp message:", error)
  }
}

/**
 * Generate response for WhatsApp messages
 * This is a simplified version - in production, you'd integrate with the full chatbot system
 */
async function generateWhatsAppResponse(
  message: string,
  restaurant: any
): Promise<string> {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("hours") || lowerMessage.includes("open")) {
    return `We're open ${restaurant.operatingHours?.[0]?.openTime || "11:00"} to ${restaurant.operatingHours?.[0]?.closeTime || "22:00"}. Would you like to make a reservation?`
  }

  if (
    lowerMessage.includes("reserve") ||
    lowerMessage.includes("book") ||
    lowerMessage.includes("table")
  ) {
    return `I'd be happy to help you make a reservation! Please tell me:
1. What date would you like to dine?
2. What time works best?
3. How many guests?

Or you can book directly on our website: ${process.env.NEXT_PUBLIC_APP_URL || "https://reservone.app"}/book/${restaurant.slug}`
  }

  if (lowerMessage.includes("menu") || lowerMessage.includes("food")) {
    return `We serve delicious ${restaurant.cuisineType || "cuisine"}! For our full menu and current offerings, please visit our restaurant or give us a call at ${restaurant.phone}.`
  }

  if (
    lowerMessage.includes("location") ||
    lowerMessage.includes("address") ||
    lowerMessage.includes("where")
  ) {
    return `We're located at ${restaurant.address}, ${restaurant.city}. Looking forward to seeing you!`
  }

  if (lowerMessage.includes("cancel")) {
    return "To cancel a reservation, please use the cancellation link in your confirmation email, or let me know your confirmation code and I'll help you."
  }

  // Default response
  return `Thank you for contacting ${restaurant.name}! I can help you with:

• Restaurant hours
• Making reservations
• Menu information
• Location and directions

What would you like to know?`
}
