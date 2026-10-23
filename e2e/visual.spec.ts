import { expect, test } from "@playwright/test"
import { addNftToCart, login, USERS } from "./helpers"

// Baselines: npm run test:e2e:update  (gera/atualiza as imagens em e2e/visual.spec.ts-snapshots)

test("início", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("main ul li h2").first()).toBeVisible()
  await page.waitForLoadState("networkidle")
  await expect(page).toHaveScreenshot("inicio.png", { fullPage: true })
})

test("detalhe do NFT", async ({ page }) => {
  await page.goto("/nfts/nft-1")
  await expect(page.getByRole("heading", { name: "NFT #001" })).toBeVisible()
  await page.waitForLoadState("networkidle")
  await expect(page).toHaveScreenshot("detalhe.png", { fullPage: true })
})

test("carrinho", async ({ page }) => {
  await addNftToCart(page, "nft-1")
  await page.waitForLoadState("networkidle")
  await expect(page).toHaveScreenshot("carrinho.png", { fullPage: true })
})

test("pagamento", async ({ page }) => {
  await login(page, USERS.ana)
  await addNftToCart(page, "nft-1")
  await page.getByRole("link", { name: "Conectar e finalizar" }).click()
  await expect(page.getByRole("heading", { name: "Pagamento com carteira" })).toBeVisible()
  await page.waitForLoadState("networkidle")
  await expect(page).toHaveScreenshot("pagamento.png", { fullPage: true })
})
