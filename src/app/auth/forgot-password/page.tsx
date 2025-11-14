"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true)

    try {
      // TODO: Implement forgot password API call
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setEmailSent(true)
      toast.success("Password reset link sent to your email!")
    } catch (error) {
      toast.error("Failed to send reset link. Please try again.")
      console.error("Forgot password error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/auth/signin" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          </div>
          <CardDescription>
            {emailSent
              ? "Check your email for a password reset link"
              : "Enter your email to receive a password reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="text-muted-foreground">
                  We've sent a password reset link to{" "}
                  <span className="font-medium text-foreground">{form.getValues("email")}</span>.
                  Please check your email and follow the instructions.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Didn't receive the email?</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEmailSent(false)
                    form.reset()
                  }}
                >
                  Try again
                </Button>
              </div>

              <div className="text-center">
                <Link
                  href="/auth/signin"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center text-sm">
                <Link
                  href="/auth/signin"
                  className="text-muted-foreground hover:text-primary"
                >
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
