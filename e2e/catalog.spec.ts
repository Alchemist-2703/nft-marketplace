import { expect, test } from "@playwright/test"

test.describe("catálogo (desktop)", () => {
  test.skip(({ isMobile }) => isMobile, "filtros em gaveta no mobile: cobertos em accessibility.spec.ts")

  test("busca, filtros combinados e ordenação refletem na URL", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("36 NFTs", { exact: true })).toBeVisible()

    await page.getByLabel("Buscar", { exact: true }).fill("NFT #01")
    await page.getByLabel("Buscar", { exact: true }).press("Enter")
    await expect(page.getByText("10 NFTs", { exact: true })).toBeVisible()
    await expect(page).toHaveURL(/q=/)

    await page.getByLabel("Categoria", { exact: true }).selectOption("Arte")
    await expect(page.getByText("2 NFTs", { exact: true })).toBeVisible()
    await expect(page).toHaveURL(/category=Arte/)

    await page.getByLabel("Ordenar por:", { exact: true }).selectOption("price_desc")
    await expect(page).toHaveURL(/sort=price_desc/)
  })

  test("paginação sobrevive a refresh e ao histórico; filtro reinicia a página", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("main ul li h2").first()).toHaveText("NFT #036")

    await page.getByRole("link", { name: "Página 2" }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.locator("main ul li h2").first()).toHaveText("NFT #024")

    await page.goBack()
    await expect(page.locator("main ul li h2").first()).toHaveText("NFT #036")

    await page.goto("/?page=3")
    await page.reload()
    await expect(page.locator("main ul li h2").first()).toHaveText("NFT #012")

    await page.goto("/?page=2")
    await page.getByLabel("Categoria", { exact: true }).selectOption("Arte")
    await expect(page).not.toHaveURL(/page=/)
  })

  test("resultado vazio mostra mensagem e permite limpar", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Buscar", { exact: true }).fill("zzzz")
    await page.getByLabel("Buscar", { exact: true }).press("Enter")
    await expect(page.getByText("Nenhum NFT encontrado para esses filtros.", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Limpar filtros" }).click()
    await expect(page.getByText("36 NFTs", { exact: true })).toBeVisible()
  })
})

test.describe("detalhe do NFT", () => {
  test("acesso direto, edição esgotada e limite de quantidade", async ({ page }) => {
    await page.goto("/nfts/nft-9")
    await expect(page.getByRole("heading", { name: "NFT #009" })).toBeVisible()
    await expect(page.getByRole("radio", { name: /Edição Rara/ })).toBeDisabled()

    await page.goto("/nfts/nft-10")
    await expect(page.getByRole("button", { name: "Aumentar quantidade" })).toBeDisabled()
    await expect(page.getByText("Limite de 1 unidade")).toBeVisible()
  })

  test("NFT inexistente mostra mensagem apropriada", async ({ page }) => {
    await page.goto("/nfts/nft-999")
    await expect(page.getByRole("heading", { name: "NFT não encontrado" })).toBeVisible()
  })

  test("rota inexistente mostra página 404", async ({ page }) => {
    await page.goto("/qualquer-coisa")
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible()
  })
})
