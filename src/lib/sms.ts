/**
 * SMS Notification Integration with Twilio
 *
 * This module provides utilities for sending SMS notifications via Twilio.
 *
 * Setup:
 * 1. Create a Twilio account at twilio.com
 * 2. Get your Account SID, Auth Token, and Phone Number
 * 3. Add credentials to environment variables:
 *    - TWILIO_ACCOUNT_SID
 *    - TWILIO_AUTH_TOKEN
 *    - TWILIO_PHONE_NUMBER
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
const TWILIO_API_URL = "https://api.twilio.com/2010-04-01"

export interface SMSMessage {
  to: string // Phone number in E.164 format (e.g., "+1234567890")
  body: string
}

export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an SMS message via Twilio
 */
export async function sendSMS(message: SMSMessage): Promise<SMSResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("Twilio credentials not configured")
    return {
      success: false,
      error: "SMS service not configured",
    }
  }

  try {
    // Create basic auth header
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString(
      "base64"
    )

    // Send SMS via Twilio API
    const response = await fetch(
      `${TWILIO_API_URL}/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: message.to,
          From: TWILIO_PHONE_NUMBER,
          Body: message.body,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error("Twilio API error:", error)
      return {
        success: false,
        error: error.message || "Failed to send SMS",
      }
    }

    const data = await response.json()
    return {
      success: true,
      messageId: data.sid,
    }
  } catch (error) {
    console.error("SMS send error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Send reservation confirmation SMS
 */
export async function sendReservationConfirmationSMS(params: {
  phone: string
  guestName: string
  restaurantName: string
  date: Date
  time: string
  partySize: number
  confirmationToken: string
}): Promise<SMSResult> {
  const { phone, guestName, restaurantName, date, time, partySize, confirmationToken } =
    params

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const confirmationCode = confirmationToken.slice(0, 8).toUpperCase()

  const message = `Reservation Confirmed!

${restaurantName}
${formattedDate} at ${time}
Party of ${partySize}

Confirmation: ${confirmationCode}

Need to cancel? Reply CANCEL or use the link in your email.`

  return await sendSMS({
    to: phone,
    body: message,
  })
}

/**
 * Send reservation reminder SMS
 */
export async function sendReservationReminderSMS(params: {
  phone: string
  guestName: string
  restaurantName: string
  date: Date
  time: string
  partySize: number
}): Promise<SMSResult> {
  const { phone, restaurantName, date, time, partySize } = params

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  const message = `Reminder: Your reservation at ${restaurantName} is coming up!

${formattedDate} at ${time}
Party of ${partySize}

See you soon!`

  return await sendSMS({
    to: phone,
    body: message,
  })
}

/**
 * Send reservation cancellation SMS
 */
export async function sendReservationCancellationSMS(params: {
  phone: string
  guestName: string
  restaurantName: string
  date: Date
  time: string
}): Promise<SMSResult> {
  const { phone, restaurantName, date, time } = params

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  const message = `Your reservation at ${restaurantName} on ${formattedDate} at ${time} has been cancelled.

Hope to see you again soon!`

  return await sendSMS({
    to: phone,
    body: message,
  })
}

/**
 * Send reservation update/modification SMS
 */
export async function sendReservationUpdateSMS(params: {
  phone: string
  guestName: string
  restaurantName: string
  updateMessage: string
}): Promise<SMSResult> {
  const { phone, restaurantName, updateMessage } = params

  const message = `Update from ${restaurantName}:

${updateMessage}

Questions? Reply to this message or call us.`

  return await sendSMS({
    to: phone,
    body: message,
  })
}

/**
 * Send custom SMS
 */
export async function sendCustomSMS(params: {
  phone: string
  message: string
}): Promise<SMSResult> {
  return await sendSMS({
    to: params.phone,
    body: params.message,
  })
}

/**
 * Validate phone number format (E.164)
 */
export function validatePhoneNumber(phone: string): boolean {
  // E.164 format: +[country code][number]
  // Example: +12345678900
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phone)
}

/**
 * Format phone number to E.164
 * Attempts to convert various formats to E.164
 */
export function formatPhoneNumber(phone: string, defaultCountryCode = "1"): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "")

  // If it starts with country code, add +
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`
  }

  // If it's 10 digits (US/Canada), add country code
  if (cleaned.length === 10) {
    return `+${defaultCountryCode}${cleaned}`
  }

  // If it already has +, return as is
  if (phone.startsWith("+")) {
    return phone
  }

  // Otherwise, assume it needs country code
  return `+${defaultCountryCode}${cleaned}`
}

/**
 * Check if SMS service is configured
 */
export function isSMSConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER)
}
