import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

interface AuthCardProps {
  active: "login" | "signup"
  redirect?: string
  description: string
  children: ReactNode
}

export function AuthCard({ active, redirect, description, children }: AuthCardProps) {
  const tabClass = (isActive: boolean) =>
    cn(
      "pb-1 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
      isActive ? "border-b-2 border-primary" : "text-muted-foreground",
    )

  return (
    <div className="mx-auto w-full max-w-[500px] rounded-xl border border-border bg-card px-6 py-10 sm:px-20">
      <div className="mb-3 flex justify-center gap-6">
        <Link
          to="/login"
          search={{ redirect }}
          aria-current={active === "login" ? "page" : undefined}
          className={tabClass(active === "login")}
        >
          Entrar
        </Link>
        <Link
          to="/signup"
          search={{ redirect }}
          aria-current={active === "signup" ? "page" : undefined}
          className={tabClass(active === "signup")}
        >
          Criar conta
        </Link>
      </div>
      <p className="mb-8 text-center text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  )
}
