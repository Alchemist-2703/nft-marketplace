import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router"
import { getStatus } from "@/api/errors"
import { RootLayout } from "@/components/layout/RootLayout"
import { sessionQuery } from "@/features/auth/queries"
import { parseAuthSearch } from "@/features/auth/search"
import { sessionActions, tokenStore } from "@/features/auth/session-store"
import { parseHomeSearch } from "@/features/catalog/search"
import { queryClient } from "@/lib/query-client"
import { CartPage } from "@/routes/CartPage"
import { CheckoutPage } from "@/routes/CheckoutPage"
import { HomePage } from "@/routes/HomePage"
import { LoginPage } from "@/routes/LoginPage"
import { NftDetailPage } from "@/routes/NftDetailPage"
import { NotFoundPage } from "@/routes/NotFoundPage"
import { OrderPage } from "@/routes/OrderPage"
import { ProfilePage } from "@/routes/ProfilePage"
import { SignupPage } from "@/routes/SignupPage"
import { WalletsPage } from "@/routes/WalletsPage"

async function requireAuth(href: string): Promise<void> {
  if (!tokenStore.get()) {
    throw redirect({ to: "/login", search: { redirect: href } })
  }

  try {
    await queryClient.fetchQuery({ ...sessionQuery(), staleTime: 15_000 })
  } catch (error) {
    if (getStatus(error) === 401) {
      sessionActions.signOut()
      queryClient.clear()
      throw redirect({ to: "/login", search: { redirect: href, expired: true } })
    }
    throw error
  }
}

function redirectIfAuthenticated(): void {
  if (tokenStore.get()) {
    throw redirect({ to: "/" })
  }
}

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: parseHomeSearch,
  component: HomePage,
})

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nfts/$nftId",
  component: NftDetailPage,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: CartPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: CheckoutPage,
})

const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/$orderId",
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: OrderPage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: ProfilePage,
})

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallets",
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: WalletsPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: parseAuthSearch,
  beforeLoad: redirectIfAuthenticated,
  component: LoginPage,
})

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  validateSearch: parseAuthSearch,
  beforeLoad: redirectIfAuthenticated,
  component: SignupPage,
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  nftDetailRoute,
  cartRoute,
  checkoutRoute,
  orderRoute,
  profileRoute,
  walletsRoute,
  loginRoute,
  signupRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
