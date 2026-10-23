import { expect, test } from "@playwright/test"
import {
  addNftToCart,
  bumpCartPrice,
  dropSockets,
  emitStaleEvent,
  loginAndReachReview,
  replayLastEvent,
  waitForSocket,
} from "./helpers"

test("mudança de preço via Socket.IO atualiza o carrinho e avisa o usuário", async ({ page }) => {
  await addNftToCart(page, "nft-1")
  await waitForSocket(page)

  await bumpCartPrice(page)
  await expect(page.getByText(/O preço de NFT #001/)).toBeVisible()
})

test("página de detalhe recebe a atualização de preço em tempo real", async ({ page }) => {
  await addNftToCart(page, "nft-1")
  await page.goto("/nfts/nft-1")
  await waitForSocket(page)

  const before = await page.locator("main p.text-highlight").first().innerText()
  await bumpCartPrice(page)
  await expect(page.locator("main p.text-highlight").first()).not.toHaveText(before)
})

test("checkout bloqueia a confirmação com cotação desatualizada", async ({ page }) => {
  await loginAndReachReview(page)
  await waitForSocket(page)

  await bumpCartPrice(page)
  await expect(page.getByRole("button", { name: "Aceitar novos valores" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Confirmar compra" })).toBeDisabled()

  await page.getByRole("button", { name: "Aceitar novos valores" }).click()
  await expect(page.getByRole("button", { name: "Confirmar compra" })).toBeEnabled()
})

test("eventos duplicados ou antigos não regridem o estado", async ({ page }) => {
  await addNftToCart(page, "nft-1")
  await waitForSocket(page)

  await bumpCartPrice(page)
  await expect(page.getByText(/O preço de NFT #001/)).toBeVisible()

  await replayLastEvent(page)
  await emitStaleEvent(page)
  await page.waitForTimeout(800)

  await expect(page.getByText("99.99")).toHaveCount(0)
  await expect(page.getByText(/O preço de NFT #001/)).toHaveCount(1)
})

test("queda de conexão com pedido pendente retoma sem criar outra compra", async ({ page }) => {
  await loginAndReachReview(page)
  await waitForSocket(page)

  await page.getByRole("button", { name: "Confirmar compra" }).click()
  await dropSockets(page)

  await expect(page.getByRole("heading", { name: "Seus NFTs agora estão na sua carteira" })).toBeVisible({
    timeout: 20_000,
  })
  const orders = await page.evaluate(() => {
    const raw = window.localStorage.getItem("mock-db-v1")
    return raw ? (JSON.parse(raw) as { orders: unknown[] }).orders.length : 0
  })
  expect(orders).toBe(1)
})
