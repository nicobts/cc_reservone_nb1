export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">ReservOne</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Restaurant Reservation Management Platform
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/auth/signin"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Sign In
            </a>
            <a
              href="/dashboard"
              className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Dashboard
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
