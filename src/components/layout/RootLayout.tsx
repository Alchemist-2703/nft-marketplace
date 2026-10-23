import { Link, Outlet } from "@tanstack/react-router"

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-4">
        <Link to="/" className="text-lg font-bold">
          NFT Marketplace
        </Link>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}