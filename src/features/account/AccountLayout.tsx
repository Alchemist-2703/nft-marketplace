import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"

interface AccountLayoutProps {
  active: "profile" | "wallets"
  title: string
  children: ReactNode
}

const itemClass =
  "block rounded-md px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring aria-[current=page]:bg-secondary aria-[current=page]:font-bold"

export function AccountLayout({ active, title, children }: AccountLayoutProps) {
  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <nav aria-label="Minha conta" className="flex gap-2 overflow-x-auto md:flex-col">
        <Link to="/profile" aria-current={active === "profile" ? "page" : undefined} className={itemClass}>
          Perfil do colecionador
        </Link>
        <Link to="/wallets" aria-current={active === "wallets" ? "page" : undefined} className={itemClass}>
          Carteiras
        </Link>
      </nav>
      <section aria-labelledby="account-title" className="min-w-0 space-y-8">
        <h1 id="account-title" className="text-2xl font-bold">
          {title}
        </h1>
        {children}
      </section>
    </div>
  )
}
