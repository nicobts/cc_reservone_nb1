import { Resend } from "resend"

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email sender configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "ReservOne <noreply@reservone.com>"

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (error) {
      console.error("Failed to send email:", error)
      throw new Error(`Email sending failed: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Email service error:", error)
    throw error
  }
}

/**
 * Send reservation confirmation email
 */
export async function sendReservationConfirmation({
  guestEmail,
  guestName,
  restaurantName,
  reservationDate,
  partySize,
  confirmationToken,
  specialRequests,
}: {
  guestEmail: string
  guestName: string
  restaurantName: string
  reservationDate: Date
  partySize: number
  confirmationToken: string
  specialRequests?: string
}) {
  const dateStr = reservationDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const timeStr = reservationDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  const subject = `Reservation Confirmation - ${restaurantName}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #6b7280;
          }
          .detail-value {
            color: #111827;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .alert {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Reservation Confirmed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for choosing ${restaurantName}</p>
        </div>

        <div class="content">
          <p>Dear ${guestName},</p>
          <p>Your reservation has been confirmed! We look forward to welcoming you.</p>

          <div class="details">
            <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Reservation Details</h2>

            <div class="detail-row">
              <span class="detail-label">Restaurant</span>
              <span class="detail-value">${restaurantName}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${dateStr}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Time</span>
              <span class="detail-value">${timeStr}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Party Size</span>
              <span class="detail-value">${partySize} ${partySize === 1 ? "guest" : "guests"}</span>
            </div>

            ${
              specialRequests
                ? `
            <div class="detail-row">
              <span class="detail-label">Special Requests</span>
              <span class="detail-value">${specialRequests}</span>
            </div>
            `
                : ""
            }
          </div>

          <div class="alert">
            <strong>Important:</strong> Please arrive on time. If you need to cancel or modify your reservation,
            please contact us as soon as possible.
          </div>

          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/reservations/${confirmationToken}" class="button">
              View Reservation Details
            </a>
          </center>

          <p style="margin-top: 30px;">If you have any questions or need to make changes, please don't hesitate to contact the restaurant directly.</p>

          <p>See you soon!</p>
          <p><strong>The ${restaurantName} Team</strong></p>
        </div>

        <div class="footer">
          <p>This is an automated message from ReservOne. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} ReservOne. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  const text = `
Reservation Confirmed!

Dear ${guestName},

Your reservation has been confirmed at ${restaurantName}.

Reservation Details:
- Restaurant: ${restaurantName}
- Date: ${dateStr}
- Time: ${timeStr}
- Party Size: ${partySize} ${partySize === 1 ? "guest" : "guests"}
${specialRequests ? `- Special Requests: ${specialRequests}` : ""}

Please arrive on time. If you need to cancel or modify your reservation, please contact the restaurant.

View your reservation: ${process.env.NEXT_PUBLIC_APP_URL}/reservations/${confirmationToken}

See you soon!
The ${restaurantName} Team

---
This is an automated message from ReservOne.
© ${new Date().getFullYear()} ReservOne. All rights reserved.
  `

  return sendEmail({
    to: guestEmail,
    subject,
    html,
    text,
  })
}

/**
 * Send reservation reminder email
 */
export async function sendReservationReminder({
  guestEmail,
  guestName,
  restaurantName,
  restaurantPhone,
  reservationDate,
  partySize,
  confirmationToken,
}: {
  guestEmail: string
  guestName: string
  restaurantName: string
  restaurantPhone: string
  reservationDate: Date
  partySize: number
  confirmationToken: string
}) {
  const dateStr = reservationDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const timeStr = reservationDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  const subject = `Reminder: Reservation Tomorrow at ${restaurantName}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .reminder-box {
            background: #dbeafe;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 5px;
            font-weight: 600;
          }
          .button-secondary {
            background: #6b7280;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">📅 Reservation Reminder</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Don't forget your upcoming reservation!</p>
        </div>

        <div class="content">
          <p>Dear ${guestName},</p>

          <div class="reminder-box">
            <h2 style="margin-top: 0; color: #1e40af; font-size: 20px;">Your reservation is tomorrow!</h2>
            <p style="margin: 10px 0 0 0; font-size: 16px;">We're looking forward to seeing you at <strong>${restaurantName}</strong>.</p>
          </div>

          <div class="details">
            <h3 style="margin-top: 0; color: #111827;">Reservation Details</h3>
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Time:</strong> ${timeStr}</p>
            <p><strong>Party Size:</strong> ${partySize} ${partySize === 1 ? "guest" : "guests"}</p>
            <p><strong>Restaurant:</strong> ${restaurantName}</p>
            <p><strong>Contact:</strong> ${restaurantPhone}</p>
          </div>

          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/reservations/${confirmationToken}" class="button">
              View Reservation
            </a>
            <a href="tel:${restaurantPhone}" class="button button-secondary">
              Call Restaurant
            </a>
          </center>

          <p style="margin-top: 30px;">If you need to cancel or make changes to your reservation, please contact us as soon as possible.</p>

          <p>We look forward to serving you!</p>
          <p><strong>The ${restaurantName} Team</strong></p>
        </div>

        <div class="footer">
          <p>This is an automated reminder from ReservOne.</p>
          <p>&copy; ${new Date().getFullYear()} ReservOne. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  const text = `
Reservation Reminder

Dear ${guestName},

Your reservation is tomorrow!

Reservation Details:
- Date: ${dateStr}
- Time: ${timeStr}
- Party Size: ${partySize} ${partySize === 1 ? "guest" : "guests"}
- Restaurant: ${restaurantName}
- Contact: ${restaurantPhone}

View your reservation: ${process.env.NEXT_PUBLIC_APP_URL}/reservations/${confirmationToken}
Call restaurant: ${restaurantPhone}

If you need to cancel or make changes, please contact us as soon as possible.

We look forward to serving you!
The ${restaurantName} Team

---
This is an automated reminder from ReservOne.
© ${new Date().getFullYear()} ReservOne. All rights reserved.
  `

  return sendEmail({
    to: guestEmail,
    subject,
    html,
    text,
  })
}

/**
 * Send reservation cancellation email
 */
export async function sendReservationCancellation({
  guestEmail,
  guestName,
  restaurantName,
  reservationDate,
  partySize,
  reason,
}: {
  guestEmail: string
  guestName: string
  restaurantName: string
  reservationDate: Date
  partySize: number
  reason?: string
}) {
  const dateStr = reservationDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const timeStr = reservationDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  const subject = `Reservation Cancelled - ${restaurantName}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #ef4444;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Reservation Cancelled</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your reservation has been cancelled</p>
        </div>

        <div class="content">
          <p>Dear ${guestName},</p>
          <p>This email confirms that your reservation at ${restaurantName} has been cancelled.</p>

          <div class="details">
            <h3 style="margin-top: 0; color: #111827;">Cancelled Reservation</h3>
            <p><strong>Restaurant:</strong> ${restaurantName}</p>
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Time:</strong> ${timeStr}</p>
            <p><strong>Party Size:</strong> ${partySize} ${partySize === 1 ? "guest" : "guests"}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          </div>

          <p>We're sorry you won't be able to join us. We hope to see you again in the future!</p>

          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/book/${restaurantName.toLowerCase().replace(/\s+/g, "-")}" class="button">
              Make a New Reservation
            </a>
          </center>

          <p>If you have any questions, please contact the restaurant directly.</p>

          <p>Hope to see you soon!</p>
          <p><strong>The ${restaurantName} Team</strong></p>
        </div>

        <div class="footer">
          <p>This is an automated message from ReservOne.</p>
          <p>&copy; ${new Date().getFullYear()} ReservOne. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  const text = `
Reservation Cancelled

Dear ${guestName},

This email confirms that your reservation at ${restaurantName} has been cancelled.

Cancelled Reservation:
- Restaurant: ${restaurantName}
- Date: ${dateStr}
- Time: ${timeStr}
- Party Size: ${partySize} ${partySize === 1 ? "guest" : "guests"}
${reason ? `- Reason: ${reason}` : ""}

We're sorry you won't be able to join us. We hope to see you again in the future!

Make a new reservation: ${process.env.NEXT_PUBLIC_APP_URL}/book/${restaurantName.toLowerCase().replace(/\s+/g, "-")}

If you have any questions, please contact the restaurant.

Hope to see you soon!
The ${restaurantName} Team

---
This is an automated message from ReservOne.
© ${new Date().getFullYear()} ReservOne. All rights reserved.
  `

  return sendEmail({
    to: guestEmail,
    subject,
    html,
    text,
  })
}

/**
 * Send status update email (confirmed, seated, etc.)
 */
export async function sendReservationStatusUpdate({
  guestEmail,
  guestName,
  restaurantName,
  reservationDate,
  status,
  message,
}: {
  guestEmail: string
  guestName: string
  restaurantName: string
  reservationDate: Date
  status: string
  message: string
}) {
  const dateStr = reservationDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const timeStr = reservationDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  const subject = `Reservation ${status.charAt(0).toUpperCase() + status.slice(1)} - ${restaurantName}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Reservation Update</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${restaurantName}</p>
        </div>

        <div class="content">
          <p>Dear ${guestName},</p>
          <p>${message}</p>
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Time:</strong> ${timeStr}</p>
          <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
          <p>Thank you for choosing ${restaurantName}!</p>
        </div>

        <div class="footer">
          <p>This is an automated message from ReservOne.</p>
          <p>&copy; ${new Date().getFullYear()} ReservOne. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: guestEmail,
    subject,
    html,
  })
}
