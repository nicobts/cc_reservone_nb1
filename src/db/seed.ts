import { db } from "./index"
import { users, restaurants, tables, reservations, restaurantSettings, operatingHours } from "./schema"
import { hash } from "bcryptjs"

async function seed() {
  console.log("🌱 Seeding database...")

  try {
    // Create sample users
    console.log("Creating users...")
    const [owner, customer] = await db
      .insert(users)
      .values([
        {
          email: "owner@example.com",
          name: "John Owner",
          role: "owner",
          emailVerified: new Date(),
        },
        {
          email: "customer@example.com",
          name: "Jane Customer",
          role: "customer",
          emailVerified: new Date(),
        },
      ])
      .returning()

    console.log("✓ Created 2 users")

    // Create sample restaurants
    console.log("Creating restaurants...")
    const [restaurant1, restaurant2] = await db
      .insert(restaurants)
      .values([
        {
          ownerId: owner!.id,
          name: "The Italian Corner",
          slug: "the-italian-corner",
          description: "Authentic Italian cuisine in the heart of the city",
          email: "contact@italiancorner.com",
          phone: "+1 234 567 8900",
          website: "https://www.italiancorner.com",
          address: "123 Main Street",
          city: "New York",
          state: "NY",
          country: "USA",
          postalCode: "10001",
          timezone: "America/New_York",
          currency: "USD",
          maxCapacity: 100,
          isActive: true,
          isVerified: true,
        },
        {
          ownerId: owner!.id,
          name: "Sushi Paradise",
          slug: "sushi-paradise",
          description: "Fresh sushi and Japanese delights",
          email: "info@sushiparadise.com",
          phone: "+1 234 567 8901",
          website: "https://www.sushiparadise.com",
          address: "456 Ocean Drive",
          city: "Los Angeles",
          state: "CA",
          country: "USA",
          postalCode: "90001",
          timezone: "America/Los_Angeles",
          currency: "USD",
          maxCapacity: 60,
          isActive: true,
          isVerified: false,
        },
      ])
      .returning()

    console.log("✓ Created 2 restaurants")

    // Create restaurant settings
    console.log("Creating restaurant settings...")
    await db.insert(restaurantSettings).values([
      {
        restaurantId: restaurant1!.id,
        advanceBookingDays: 30,
        minAdvanceBookingHours: 2,
        maxPartySize: 12,
        defaultReservationDuration: 120,
        slotInterval: 15,
        autoConfirmReservations: false,
        sendReminderEmail: true,
        sendReminderSMS: false,
        reminderHoursBefore: 24,
        allowTableSelection: false,
        autoAssignTables: true,
        enableWaitlist: false,
      },
      {
        restaurantId: restaurant2!.id,
        advanceBookingDays: 30,
        minAdvanceBookingHours: 2,
        maxPartySize: 8,
        defaultReservationDuration: 90,
        slotInterval: 15,
        autoConfirmReservations: true,
        sendReminderEmail: true,
        sendReminderSMS: false,
        reminderHoursBefore: 24,
        allowTableSelection: false,
        autoAssignTables: true,
        enableWaitlist: true,
      },
    ])

    console.log("✓ Created restaurant settings")

    // Create operating hours (Monday-Sunday for both restaurants)
    console.log("Creating operating hours...")
    const operatingHoursData = []

    // Restaurant 1: Open every day 11:00 AM - 10:00 PM
    for (let day = 0; day < 7; day++) {
      operatingHoursData.push({
        restaurantId: restaurant1!.id,
        dayOfWeek: day,
        openTime: "11:00",
        closeTime: "22:00",
        isClosed: false,
      })
    }

    // Restaurant 2: Open Tuesday-Sunday, closed Monday
    for (let day = 0; day < 7; day++) {
      operatingHoursData.push({
        restaurantId: restaurant2!.id,
        dayOfWeek: day,
        openTime: day === 1 ? "00:00" : "12:00",
        closeTime: day === 1 ? "00:00" : "23:00",
        isClosed: day === 1, // Closed on Monday
      })
    }

    await db.insert(operatingHours).values(operatingHoursData)

    console.log("✓ Created operating hours")

    // Create sample tables
    console.log("Creating tables...")
    const tablesData = []

    // Restaurant 1 tables
    for (let i = 1; i <= 20; i++) {
      tablesData.push({
        restaurantId: restaurant1!.id,
        name: `Table ${i}`,
        number: i,
        minCapacity: i % 3 === 0 ? 4 : 2,
        maxCapacity: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
        shape: (["round", "square", "rectangle"] as const)[i % 3],
        location: (["indoor", "outdoor", "patio"] as const)[i % 3],
        isActive: true,
      })
    }

    // Restaurant 2 tables
    for (let i = 1; i <= 12; i++) {
      tablesData.push({
        restaurantId: restaurant2!.id,
        name: `Table ${i}`,
        number: i,
        minCapacity: 2,
        maxCapacity: i % 4 === 0 ? 8 : 4,
        shape: (["round", "rectangle"] as const)[i % 2],
        location: "indoor" as const,
        isActive: true,
      })
    }

    await db.insert(tables).values(tablesData)

    console.log("✓ Created tables")

    // Create sample reservations
    console.log("Creating reservations...")
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    await db.insert(reservations).values([
      {
        restaurantId: restaurant1!.id,
        userId: customer!.id,
        guestName: "Jane Customer",
        guestEmail: "customer@example.com",
        guestPhone: "+1 234 567 8999",
        reservationDate: new Date(today.setHours(19, 0, 0, 0)),
        duration: 120,
        partySize: 4,
        status: "confirmed",
        source: "website",
        specialRequests: "Window seat if available",
        confirmationToken: crypto.randomUUID(),
        confirmedAt: new Date(),
      },
      {
        restaurantId: restaurant1!.id,
        guestName: "John Smith",
        guestEmail: "john.smith@example.com",
        guestPhone: "+1 234 567 8888",
        reservationDate: new Date(today.setHours(20, 0, 0, 0)),
        duration: 120,
        partySize: 2,
        status: "pending",
        source: "phone",
        confirmationToken: crypto.randomUUID(),
      },
      {
        restaurantId: restaurant2!.id,
        guestName: "Sarah Johnson",
        guestEmail: "sarah.j@example.com",
        guestPhone: "+1 234 567 7777",
        reservationDate: new Date(tomorrow.setHours(18, 30, 0, 0)),
        duration: 90,
        partySize: 6,
        status: "confirmed",
        source: "website",
        occasion: "Anniversary",
        confirmationToken: crypto.randomUUID(),
        confirmedAt: new Date(),
      },
    ])

    console.log("✓ Created reservations")

    console.log("🎉 Seed completed successfully!")
  } catch (error) {
    console.error("❌ Seed failed:", error)
    throw error
  }
}

seed()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
