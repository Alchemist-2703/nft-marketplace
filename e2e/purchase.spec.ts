import { expect, test } from "@playwright/test"
import {
  addNftToCart,
  loginAndReachReview,
  setScenario,
  storedOrders,
} from "./helpers"

test("carrinho: quantidade, cupom inválido/expirado/válido e persistência no refresh", async ({ page }) => {
  await addNftToCart(page, "nft-1")

  await page.getByRole("button", { name: "Aumentar quantidade" }).click()
  await expect(page.getByText("2", { exact: true }).first()).toBeVisible()

  await page.getByLabel("Código promocional").fill("XYZ")
  await page.getByRole("button", { name: "Aplicar" }).click()
  await expect(page.getByText("Cupom inválido.")).toBeVisible()

  await page.getByLabel("Código promocional").fill("EXPIRED10")
  await page.getByRole("button", { name: "Aplicar" }).click()
  await expect(page.getByText("Cupom expirado.")).toBeVisible()

  await page.getByLabel("Código promocional").fill("WELCOME10")
  await page.getByRole("button", { name: "Aplicar" }).click()
  await expect(page.getByText("Cupom WELCOME10 aplicado")).toBeVisible()

  await page.reload()
  await expect(page.getByText("Cupom WELCOME10 aplicado")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Carrinho de NFTs" })).toBeVisible()

  await page.getByRole("button", { name: /Remover NFT #001/ }).click()
  await expect(page.getByRole("heading", { name: "Seu carrinho está vazio" })).toBeVisible()
})

test("compra completa do catálogo ao recibo confirmado", async ({ page }) => {
  await loginAndReachReview(page)
  await expect(page.getByText("NFT #001 (Edição Comum) × 1")).toBeVisible()
  await page.getByRole("button", { name: "Confirmar compra" }).click()
  await expect(page.getByRole("heading", { name: "Seus NFTs agora estão na sua carteira" })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText("NFT #001", { exact: true })).toBeVisible()
  await page.goto("/cart")
  await expect(page.getByRole("heading", { name: "Seu carrinho está vazio" })).toBeVisible()
})

test("pagamento recusado mantém os itens no carrinho", async ({ page }) => {
  await loginAndReachReview(page)
  await setScenario(page, { paymentOutcome: "decline" })
  await page.getByRole("button", { name: "Confirmar compra" }).click()
  await expect(page.getByRole("heading", { name: "Pagamento recusado" })).toBeVisible({ timeout: 15_000 })

  await page.getByRole("link", { name: "Ver carrinho" }).click()
  await expect(page.getByText("NFT #001", { exact: true })).toBeVisible()
})

test("clique repetido não duplica o pedido", async ({ page }) => {
  await loginAndReachReview(page)
  await page.getByRole("button", { name: "Confirmar compra" }).dblclick()
  await expect(page.getByRole("heading", { name: "Seus NFTs agora estão na sua carteira" })).toBeVisible({
    timeout: 15_000,
  })
  expect(await storedOrders(page)).toBe(1)
})

test("timeout após criar o pedido recupera o mesmo pedido por idempotência", async ({ page }) => {
  test.setTimeout(70_000)
  await loginAndReachReview(page)
  await setScenario(page, { orderTimeoutOnce: true })

  await page.getByRole("button", { name: "Confirmar compra" }).click()
  await expect(page.getByText("Não recebemos resposta do servidor", { exact: false })).toBeVisible({
    timeout: 20_000,
  })

  await page.getByRole("button", { name: "Confirmar compra" }).click()
  await expect(page.getByRole("heading", { name: "Seus NFTs agora estão na sua carteira" })).toBeVisible({
    timeout: 20_000,
  })
  expect(await storedOrders(page)).toBe(1)
})

test("recarregar com pedido pendente retoma o mesmo pedido", async ({ page }) => {
  await loginAndReachReview(page)
  await page.getByRole("button", { name: "Confirmar compra" }).click()
  await expect(page.getByRole("heading", { name: "Aguardando confirmação" })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("heading", { name: "Seus NFTs agora estão na sua carteira" })).toBeVisible({
    timeout: 15_000,
  })
  expect(await storedOrders(page)).toBe(1)
})
