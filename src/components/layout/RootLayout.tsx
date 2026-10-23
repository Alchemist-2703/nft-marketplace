import { lazy, Suspense, useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link, Outlet, useLocation, useRouter } from "@tanstack/react-router"
import { expiredStore, sessionActions } from "@/features/auth/session-store"
import { RealtimeBridge } from "@/features/realtime/RealtimeBridge"
import { RealtimeNotices } from "@/features/realtime/RealtimeNotices"
import { useStore } from "@/lib/store"
import { isPanelEnabled } from "@/mocks/panel-flag"
import { Header } from "./Header"

const PROTECTED_PREFIXES = ["/checkout", "/orders", "/profile", "/wallets"]

const TITLES: [string, string][] = [
  ["/cart", "Carrinho"],
  ["/checkout", "Pagamento"],
  ["/orders", "Pedido"],
  ["/profile", "Perfil do colecionador"],
  ["/wallets", "Carteiras"],
  ["/login", "Entrar"],
  ["/signup", "Criar conta"],
  ["/nfts", "Detalhes do NFT"],
]

const MockPanel =
  import.meta.env.VITE_ENABLE_MOCKS === "true" ? lazy(() => import("@/mocks/panel/MockPanel")) : null

export function RootLayout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const location = useLocation()
  const expired = useStore(expiredStore, (value) => value)
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)

  const pathname = location.pathname
  const href = location.href
  const onProtectedPage = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const onAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup")

  useEffect(() => {
    if (!expired) {
      return
    }
    queryClient.clear()

    if (onProtectedPage) {
      sessionActions.acknowledgeExpired()
      router.history.push(`/login?redirect=${encodeURIComponent(href)}&expired=true`)
    } else if (onAuthPage) {
      sessionActions.acknowledgeExpired()
    }
  }, [expired, onProtectedPage, onAuthPage, href, queryClient, router])

  useEffect(() => {
    const match = TITLES.find(([prefix]) => pathname.startsWith(prefix))
    document.title = match ? `${match[1]} · NFT Marketplace` : "NFT Marketplace"

    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [pathname])

  const showExpiredBanner = expired && !onProtectedPage && !onAuthPage
  const showPanel = MockPanel !== null && isPanelEnabled()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Ir para o conteúdo principal
      </a>

      <Header />
      <RealtimeBridge />
      <RealtimeNotices />

      {showExpiredBanner && (
        <div role="alert" className="mt-3 border-y border-border bg-secondary px-6 py-3 text-sm">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <span>Sua sessão expirou. Entre novamente para continuar.</span>
            <span className="flex gap-4">
              <Link to="/login" search={{ redirect: href }} className="underline">
                Entrar
              </Link>
              <button type="button" className="underline" onClick={() => sessionActions.acknowledgeExpired()}>
                Dispensar
              </button>
            </span>
          </div>
        </div>
      )}

      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto max-w-7xl px-4 py-8 outline-none sm:px-6"
      >
        <Outlet />
      </main>

      {showPanel && MockPanel && (
        <Suspense fallback={null}>
          <MockPanel />
        </Suspense>
      )}
    </div>
  )
}
