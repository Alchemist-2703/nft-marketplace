import { expect, type Page } from "@playwright/test"

interface Mocks {
  setScenario: (value: Record<string, unknown>) => void
  bumpCartPrice: (percent?: number) => boolean
  expireSession: () => void
  realtime: {
    connectedClients: () => number
    dropConnections: () => void
    replayLastEvent: () => boolean
    emitStaleEvent: () => void
  }
}

type MockWindow = Window & { __mocks?: Mocks }

export const USERS = {
  ana: { email: "ana@kurio.dev", password: "Senha@123", name: "Ana Colecionadora" },
  bruno: { email: "bruno@kurio.dev", password: "Senha@456", name: "Bruno Artista" },
} as const

export function setScenario(page: Page, partial: Record<string, unknown>) {
  return page.evaluate((value) => {
    ;(window as MockWindow).__mocks?.setScenario(value)
  }, partial)
}

export function bumpCartPrice(page: Page) {
  return page.evaluate(() => (window as MockWindow).__mocks?.bumpCartPrice(10) ?? false)
}

export function expireServerSession(page: Page) {
  return page.evaluate(() => {
    ;(window as MockWindow).__mocks?.expireSession()
  })
}

export function connectedSockets(page: Page) {
  return page.evaluate(() => (window as MockWindow).__mocks?.realtime.connectedClients() ?? 0)
}

export function dropSockets(page: Page) {
  return page.evaluate(() => {
    ;(window as MockWindow).__mocks?.realtime.dropConnections()
  })
}

export function replayLastEvent(page: Page) {
  return page.evaluate(() => (window as MockWindow).__mocks?.realtime.replayLastEvent() ?? false)
}

export function emitStaleEvent(page: Page) {
  return page.evaluate(() => {
    ;(window as MockWindow).__mocks?.realtime.emitStaleEvent()
  })
}

export function storedOrders(page: Page) {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem("mock-db-v1")
    return raw ? (JSON.parse(raw) as { orders: unknown[] }).orders.length : 0
  })
}

export async function waitForSocket(page: Page) {
  await expect.poll(() => connectedSockets(page), { timeout: 15_000 }).toBeGreaterThan(0)
}

export async function login(page: Page, user: { email: string; password: string }, redirect?: string) {
  await page.goto(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login")
  await page.getByLabel("E-mail").fill(user.email)
  await page.getByLabel("Senha", { exact: true }).fill(user.password)
  await page.getByRole("button", { name: "Entrar" }).click()
  await page.waitForURL((url) => !url.pathname.startsWith("/login"))
}

export async function addNftToCart(page: Page, nftId: string) {
  await page.goto(`/nfts/${nftId}`)
  await page.getByRole("button", { name: "COMPRAR" }).click()
  await page.waitForURL("**/cart")
  await expect(page.getByRole("heading", { name: "Carrinho de NFTs" })).toBeVisible()
}

export async function connectFirstWallet(page: Page) {
  await page.getByRole("button", { name: "Conectar", exact: true }).first().click()
  await expect(page.getByText("● Conectada")).toBeVisible()
}

export async function reachReview(page: Page) {
  await connectFirstWallet(page)
  await page.getByRole("button", { name: "Revisar pedido" }).click()
  await expect(page.getByRole("heading", { name: "Revise seu pedido" })).toBeVisible()
}

export async function loginAndReachReview(page: Page, nftId = "nft-1") {
  await addNftToCart(page, nftId)
  await page.getByRole("link", { name: "Conectar e finalizar" }).click()
  await page.waitForURL(/\/login/)
  await page.getByLabel("E-mail").fill(USERS.ana.email)
  await page.getByLabel("Senha", { exact: true }).fill(USERS.ana.password)
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page.getByRole("heading", { name: "Pagamento com carteira" })).toBeVisible()
  await reachReview(page)
}
