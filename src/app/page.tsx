"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Search, Bell, Smartphone, CheckCircle, Sparkles } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold">
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  ReservOne
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Your table is waiting. Book instantly at the best restaurants in town.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/restaurants">
                  <Search className="mr-2 h-5 w-5" />
                  Browse Restaurants
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                <Link href="/auth/signin">
                  Restaurant Owner?
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              No credit card required. Book in seconds. ✨
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose ReservOne?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, fast, and reliable restaurant reservations at your fingertips
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <Card className="border-2">
            <CardContent className="pt-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Discover Restaurants</h3>
              <p className="text-muted-foreground">
                Browse hundreds of restaurants with powerful search and filters. Find your perfect dining experience.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border-2">
            <CardContent className="pt-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Book Instantly</h3>
              <p className="text-muted-foreground">
                Check real-time availability and book your table in seconds. No phone calls, no waiting.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border-2">
            <CardContent className="pt-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Get Reminders</h3>
              <p className="text-muted-foreground">
                Receive email reminders 24 hours before your reservation. Never miss your table again.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="border-2">
            <CardContent className="pt-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Mobile Friendly</h3>
              <p className="text-muted-foreground">
                Book from anywhere, on any device. Our platform works seamlessly on mobile and desktop.
              </p>
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card className="border-2">
            <CardContent className="pt-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Instant Confirmation</h3>
              <p className="text-muted-foreground">
                Get immediate confirmation emails with all your reservation details and booking reference.
              </p>
            </CardContent>
          </Card>

          {/* Feature 6 */}
          <Card className="border-2">
            <CardContent className="pt-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Special Occasions</h3>
              <p className="text-muted-foreground">
                Let restaurants know about birthdays, anniversaries, or special requests when you book.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-y">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Dine?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start exploring amazing restaurants and book your next table in seconds.
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/restaurants">
              <Search className="mr-2 h-5 w-5" />
              Find Restaurants
            </Link>
          </Button>
        </div>
      </div>

      {/* For Restaurant Owners */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-gradient-to-r from-muted/50 to-muted/20 border-2">
          <CardContent className="py-12">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl font-bold">Own a Restaurant?</h2>
              <p className="text-lg text-muted-foreground">
                Join ReservOne and streamline your reservation management. Get access to powerful tools,
                automated reminders, and analytics to grow your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button asChild size="lg" variant="default">
                  <Link href="/auth/signup">Get Started Free</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2025 ReservOne. All rights reserved.</p>
            <p className="text-sm mt-2">Making restaurant reservations simple and beautiful.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
