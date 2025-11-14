/**
 * WhatsApp Business API Integration
 *
 * This module provides utilities for sending messages via WhatsApp Business API.
 * Requires WhatsApp Business API credentials from Meta (Facebook).
 *
 * Setup:
 * 1. Create a Meta Business account
 * 2. Set up WhatsApp Business API
 * 3. Get access token and phone number ID
 * 4. Add credentials to environment variables:
 *    - WHATSAPP_ACCESS_TOKEN
 *    - WHATSAPP_PHONE_NUMBER_ID
 *    - WHATSAPP_WEBHOOK_VERIFY_TOKEN (for webhook verification)
 */

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

export interface WhatsAppTextMessage {
  to: string // Phone number in international format (e.g., "1234567890")
  body: string
}

export interface WhatsAppTemplateMessage {
  to: string
  templateName: string
  languageCode?: string // Default: "en_US"
  parameters?: string[]
}

export interface WhatsAppButtonMessage {
  to: string
  body: string
  buttons: Array<{
    id: string
    title: string
  }>
}

/**
 * Send a text message via WhatsApp
 */
export async function sendWhatsAppMessage(message: WhatsAppTextMessage): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return {
      success: false,
      error: "WhatsApp API credentials not configured",
    }
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: message.to,
          type: "text",
          text: {
            preview_url: false,
            body: message.body,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error("WhatsApp API error:", error)
      return {
        success: false,
        error: error.error?.message || "Failed to send WhatsApp message",
      }
    }

    const data = await response.json()
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    }
  } catch (error) {
    console.error("WhatsApp send error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Send a template message via WhatsApp
 * Templates must be pre-approved by Meta
 */
export async function sendWhatsAppTemplate(
  message: WhatsAppTemplateMessage
): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return {
      success: false,
      error: "WhatsApp API credentials not configured",
    }
  }

  try {
    const components = message.parameters
      ? [
          {
            type: "body",
            parameters: message.parameters.map((param) => ({
              type: "text",
              text: param,
            })),
          },
        ]
      : []

    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: message.to,
          type: "template",
          template: {
            name: message.templateName,
            language: {
              code: message.languageCode || "en_US",
            },
            components,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error("WhatsApp API error:", error)
      return {
        success: false,
        error: error.error?.message || "Failed to send WhatsApp template",
      }
    }

    const data = await response.json()
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    }
  } catch (error) {
    console.error("WhatsApp template send error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Send an interactive button message via WhatsApp
 */
export async function sendWhatsAppButtons(
  message: WhatsAppButtonMessage
): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return {
      success: false,
      error: "WhatsApp API credentials not configured",
    }
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: message.to,
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text: message.body,
            },
            action: {
              buttons: message.buttons.map((btn) => ({
                type: "reply",
                reply: {
                  id: btn.id,
                  title: btn.title,
                },
              })),
            },
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error("WhatsApp API error:", error)
      return {
        success: false,
        error: error.error?.message || "Failed to send WhatsApp buttons",
      }
    }

    const data = await response.json()
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    }
  } catch (error) {
    console.error("WhatsApp button send error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(messageId: string): Promise<boolean> {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return false
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error("WhatsApp mark read error:", error)
    return false
  }
}

/**
 * Send reservation confirmation via WhatsApp
 */
export async function sendReservationConfirmationWhatsApp(params: {
  phone: string
  guestName: string
  restaurantName: string
  date: Date
  time: string
  partySize: number
  confirmationToken: string
}): Promise<void> {
  const { phone, guestName, restaurantName, date, time, partySize, confirmationToken } =
    params

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const message = `✅ Reservation Confirmed!

Hi ${guestName},

Your reservation at ${restaurantName} has been confirmed:

📅 ${formattedDate}
🕐 ${time}
👥 ${partySize} ${partySize === 1 ? "guest" : "guests"}

Confirmation Code: ${confirmationToken.slice(0, 8).toUpperCase()}

To cancel or modify your reservation, please visit our website or reply to this message.

We look forward to seeing you!`

  await sendWhatsAppMessage({
    to: phone,
    body: message,
  })
}

/**
 * Send reservation reminder via WhatsApp
 */
export async function sendReservationReminderWhatsApp(params: {
  phone: string
  guestName: string
  restaurantName: string
  date: Date
  time: string
  partySize: number
}): Promise<void> {
  const { phone, guestName, restaurantName, date, time, partySize } = params

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const message = `⏰ Reservation Reminder

Hi ${guestName},

This is a friendly reminder about your upcoming reservation:

📍 ${restaurantName}
📅 ${formattedDate}
🕐 ${time}
👥 ${partySize} ${partySize === 1 ? "guest" : "guests"}

We're looking forward to welcoming you!

If you need to make any changes, please let us know as soon as possible.`

  await sendWhatsAppMessage({
    to: phone,
    body: message,
  })
}

/**
 * Validate webhook signature for security
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  const crypto = require("crypto")
  const hmac = crypto.createHmac("sha256", appSecret)
  const expectedSignature = "sha256=" + hmac.update(payload).digest("hex")
  return signature === expectedSignature
}
