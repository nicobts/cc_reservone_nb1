# ReservOne 🍽️

**State-of-the-art reservation management platform for restaurants and bistros**

ReservOne is a full-featured, production-ready restaurant reservation management system built with modern technologies. It enables restaurant owners and staff to efficiently manage reservations, bookings, and payments with powerful automations and AI-driven features.

## ✨ Features

### Phase 1 (Core Features)
- 🔐 **Authentication & Authorization** - Role-based access control (Owner, Manager, Staff, Customer)
- 🏪 **Restaurant Management** - Multi-restaurant support with comprehensive settings
- 📅 **Reservation System** - Advanced booking management with real-time availability
- 💳 **Payment Processing** - Stripe integration for deposits and prepayments
- 📧 **Notifications** - Multi-channel notifications (Email, SMS, WhatsApp, Telegram)
- 📊 **Analytics Dashboard** - Real-time insights and reporting
- 🍽️ **Table Management** - Dynamic table assignment and capacity management
- ⏰ **Operating Hours** - Flexible scheduling with special hours and holidays
- 📝 **Reservation History** - Complete audit trail of all changes

### Phase 2 (Planned)
- 🤖 **AI-Powered Chatbot** - Intelligent reservation assistant
- 💬 **Messaging Integration** - WhatsApp & Telegram booking
- 🌐 **Website Widget** - Embeddable chatbot for restaurant websites
- 🔄 **Advanced Automations** - Smart reminders, waitlist management, and more
- 📱 **Mobile App** - Native iOS and Android applications

## 🛠️ Tech Stack

### Core Framework
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful UI components

### Backend & Database
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Primary database
- **[oRPC](https://orpc.unnoq.com/)** - Type-safe API layer
- **[BetterAuth](https://better-auth.com/)** - Authentication solution

### State Management & Data Fetching
- **[TanStack Query](https://tanstack.com/query)** - Server state management
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Client state management
- **[React Hook Form](https://react-hook-form.com/)** - Form handling
- **[Zod](https://zod.dev/)** - Runtime validation

### Infrastructure & Services
- **[Stripe](https://stripe.com/)** - Payment processing
- **[Resend](https://resend.com/)** - Transactional emails
- **[Sentry](https://sentry.io/)** - Error monitoring
- **[Vercel](https://vercel.com/)** - Hosting & deployment

### Development Tools
- **[Biome](https://biomejs.dev/)** - Fast linter & formatter
- **[Vitest](https://vitest.dev/)** - Unit testing
- **[Playwright](https://playwright.dev/)** - E2E testing
- **[Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)** - Database GUI

## 📁 Project Structure

```
reservone/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   └── rpc/             # oRPC procedures
│   │   ├── dashboard/           # Dashboard pages
│   │   ├── auth/                # Auth pages (signin, signup)
│   │   └── layout.tsx           # Root layout
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   └── features/            # Feature-specific components
│   ├── db/                      # Database layer
│   │   ├── schema/              # Drizzle schemas
│   │   └── index.ts             # Database client
│   ├── server/                  # Backend logic
│   │   ├── api/                 # oRPC routers
│   │   │   ├── routers/        # Feature routers
│   │   │   ├── context.ts      # Request context
│   │   │   ├── router.ts       # Base procedures
│   │   │   └── index.ts        # App router
│   │   └── services/           # Business logic
│   ├── lib/                     # Utilities
│   │   ├── auth.ts             # Auth configuration
│   │   ├── auth-client.ts      # Auth client hooks
│   │   ├── orpc-client.ts      # oRPC client
│   │   └── utils.ts            # Helper functions
│   ├── types/                   # TypeScript types
│   └── config/                  # App configuration
├── drizzle/                     # Database migrations
├── public/                      # Static assets
├── tests/                       # Test files
├── .env.example                 # Environment variables template
├── drizzle.config.ts           # Drizzle configuration
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── biome.json                  # Biome configuration
└── package.json                # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- PostgreSQL database
- Stripe account (for payments)
- Resend account (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/reservone.git
   cd reservone
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in your `.env` file with the required credentials:
   - Database URL (PostgreSQL)
   - BetterAuth secret and URL
   - Stripe API keys
   - Resend API key
   - Sentry DSN (optional)

4. **Set up the database**
   ```bash
   # Generate migrations
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Or run migrations
   npm run db:migrate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Management

```bash
# Open Drizzle Studio (GUI for database)
npm run db:studio

# Generate new migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema changes directly (dev only)
npm run db:push
```

## 📊 Database Schema

### Core Tables

- **users** - User accounts with role-based access
- **restaurants** - Restaurant profiles and settings
- **tables** - Table management with capacity and location
- **reservations** - Booking records with status tracking
- **payments** - Payment transactions via Stripe
- **notifications** - Multi-channel notification logs
- **restaurant_settings** - Configurable restaurant preferences
- **operating_hours** - Weekly operating schedules
- **reservation_history** - Audit trail for reservations

### User Roles

- **Owner** - Full access to restaurant management
- **Manager** - Restaurant operations and staff management
- **Staff** - Reservation handling and customer service
- **Customer** - Make and manage personal reservations

## 🔒 Authentication

ReservOne uses BetterAuth for authentication with support for:

- Email & Password
- Google OAuth (configurable)
- Session management with secure cookies
- Email verification
- Password reset

### Protected Routes

All routes except `/`, `/auth/*`, and `/api/auth/*` require authentication. The middleware automatically redirects unauthenticated users to the sign-in page.

## 🎨 UI Components

Built with shadcn/ui and Radix UI primitives:

- **Forms** - Input, Label, Select with React Hook Form
- **Data Display** - Table, Card, Badge
- **Feedback** - Toast notifications with Sonner
- **Layout** - Responsive containers and grids
- **Navigation** - Tabs, Dropdown menus

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

## 📝 Code Quality

```bash
# Lint code
npm run lint

# Lint and auto-fix
npm run lint:fix

# Format code
npm run format
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Configure environment variables
4. Deploy!

### Environment Variables for Production

Make sure to set all required environment variables in your deployment platform:

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_APP_URL=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
SENTRY_DSN=
```

### Database Hosting

Recommended PostgreSQL hosting providers:
- [Neon](https://neon.tech/) - Serverless Postgres
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Vercel Postgres](https://vercel.com/storage/postgres) - Integrated with Vercel

## 📚 API Documentation

### oRPC Procedures

#### Restaurant Routes

```typescript
// Get restaurant by slug (public)
orpcClient.restaurant.getBySlug({ slug: "my-restaurant" })

// Get my restaurants (protected)
orpcClient.restaurant.getMyRestaurants()

// Create restaurant (owner only)
orpcClient.restaurant.create({ name: "...", ... })

// Update restaurant (owner only)
orpcClient.restaurant.update({ id: "...", data: { ... } })

// Delete restaurant (owner only)
orpcClient.restaurant.delete({ id: "..." })
```

#### Reservation Routes

```typescript
// Create reservation (public)
orpcClient.reservation.create({ restaurantId: "...", ... })

// Get my reservations (protected)
orpcClient.reservation.getMyReservations({ status: "confirmed" })

// Get restaurant reservations (staff)
orpcClient.reservation.getRestaurantReservations({
  restaurantId: "...",
  date: new Date(),
})

// Update reservation status (staff)
orpcClient.reservation.updateStatus({
  id: "...",
  data: { status: "confirmed" },
})

// Cancel reservation (public with token)
orpcClient.reservation.cancel({
  id: "...",
  confirmationToken: "...",
})
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style (enforced by Biome)
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful components
- [T3 Stack](https://create.t3.gg/) for inspiration
- The amazing open-source community

## 📞 Support

For questions or support:
- Open an issue on GitHub
- Contact: support@reservone.com

## 🗺️ Roadmap

### Q1 2025
- ✅ Core reservation system
- ✅ Payment integration
- ✅ Multi-channel notifications
- 🔄 Advanced analytics dashboard

### Q2 2025
- 🔄 AI chatbot integration
- 🔄 WhatsApp & Telegram booking
- 🔄 Mobile applications
- 🔄 Waitlist management

### Q3 2025
- 🔄 Multi-language support
- 🔄 POS integration
- 🔄 Menu management
- 🔄 Customer loyalty program

---

**Built with ❤️ for the restaurant industry**
