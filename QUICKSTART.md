# Quick Start Guide

Get ReservOne up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or hosted)
- npm, pnpm, or yarn

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/reservone.git
cd reservone

# Install dependencies
npm install
```

## Step 2: Environment Setup

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` and add your database URL:

```env
# Minimum required for development
DATABASE_URL="postgresql://user:password@localhost:5432/reservone"
BETTER_AUTH_SECRET="your-secret-min-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Step 3: Database Setup

```bash
# Push schema to database
npm run db:push
```

## Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## Step 5: Optional - Add Sample Data

You can use Drizzle Studio to add sample data:

```bash
npm run db:studio
```

This opens a GUI at `https://local.drizzle.studio` where you can:
- View all tables
- Add restaurants
- Create test reservations
- Manage users

## Next Steps

### Create Your First Restaurant

1. Sign up at `/auth/signup`
2. Navigate to `/dashboard`
3. Click "Add Restaurant"
4. Fill in restaurant details
5. Configure operating hours and settings

### Set Up Payment Processing

1. Get your Stripe API keys from [dashboard.stripe.com](https://dashboard.stripe.com)
2. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```

### Set Up Email Notifications

1. Get your Resend API key from [resend.com](https://resend.com)
2. Add to `.env`:
   ```env
   RESEND_API_KEY="re_..."
   RESEND_FROM_EMAIL="noreply@yourdomain.com"
   ```

## Production Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import to Vercel
3. Configure environment variables
4. Deploy!

### Database Hosting

For production, use:
- [Neon](https://neon.tech/) - Serverless Postgres (Recommended)
- [Supabase](https://supabase.com/) - Open source alternative
- [Vercel Postgres](https://vercel.com/storage/postgres) - Native integration

## Common Issues

### Database Connection Error

```bash
# Make sure PostgreSQL is running
pg_ctl -D /usr/local/var/postgres start

# Or using Docker
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

### Port Already in Use

```bash
# Use a different port
PORT=3001 npm run dev
```

### Module Not Found

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Development Tools

### Recommended VS Code Extensions

- **Biome** - Linting & formatting
- **Tailwind CSS IntelliSense** - Class autocomplete
- **Playwright Test for VSCode** - E2E testing

### Useful Commands

```bash
# Format code
npm run format

# Run linter
npm run lint

# Type check
npm run type-check

# Run tests
npm run test

# Build for production
npm run build
```

## Getting Help

- 📖 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/yourusername/reservone/issues)
- 💬 [Discussions](https://github.com/yourusername/reservone/discussions)
- 📧 Email: support@reservone.com

Happy coding! 🚀
