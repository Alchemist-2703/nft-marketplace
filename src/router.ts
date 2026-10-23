import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router"
import { RootLayout } from "@/components/layout/RootLayout"
import { parseHomeSearch } from "@/features/catalog/search"
import { HomePage } from "@/routes/HomePage"
import { NftDetailPage } from "@/routes/NftDetailPage"
import { NotFoundPage } from "@/routes/NotFoundPage"

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

const routeTree = rootRoute.addChildren([homeRoute, nftDetailRoute])

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}