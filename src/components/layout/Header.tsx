import { useState } from "react"
import { Link, useRouter } from "@tanstack/react-router"
import { Drawer } from "@/components/Drawer"
import { Button } from "@/components/ui/button"
import { useLogout, useSession } from "@/features/auth/queries"
import { useCartCount } from "@/features/cart/hooks"

const linkClass = "hover:underline focus-visible:outline-2 focus-visible:outline-ring"

export function Header() {
  const router = useRouter()
  const { user, isLoading } = useSession()
  const count = useCartCount()
  const logout = useLogout()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    setMenuOpen(false)
    await logout.mutateAsync()
    router.history.push("/")
  }

  const close = () => setMenuOpen(false)

  const accountLinks = isLoading ? (
    <span className="text-muted-foreground">Verificando sessão…</span>
  ) : user ? (
    <>
      <Link to="/profile" className={linkClass} onClick={close}>
        Perfil
      </Link>
      <Link to="/wallets" className={linkClass} onClick={close}>
        Carteiras
      </Link>
      <span className="flex items-center gap-2 text-muted-foreground">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground"
          >
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
        {user.name}
      </span>
      <Button type="button" variant="outline" size="sm" onClick={handleLogout} disabled={logout.isPending}>
        Sair
      </Button>
    </>
  ) : (
    <>
      <Link to="/login" className={linkClass} onClick={close}>
        Entrar
      </Link>
      <Link to="/signup" className={linkClass} onClick={close}>
        Criar conta
      </Link>
    </>
  )

  return (
    <header className="border-b px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link to="/" className="text-lg font-bold focus-visible:outline-2 focus-visible:outline-ring">
          NFT Marketplace
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link
            to="/cart"
            className={linkClass}
            aria-label={`Carrinho, ${count} ${count === 1 ? "item" : "itens"}`}
          >
            Carrinho ({count})
          </Link>

          <nav aria-label="Conta" className="hidden items-center gap-4 md:flex">
            {accountLinks}
          </nav>

          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 md:hidden"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            Menu
          </button>
        </div>
      </div>

      <Drawer open={menuOpen} onClose={close} title="Menu" side="right">
        <nav aria-label="Conta (menu)" className="flex flex-col items-start gap-5 text-base">
          {accountLinks}
        </nav>
      </Drawer>
    </header>
  )
}
