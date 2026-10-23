import { expect, test } from "@playwright/test"

test("link de pular para o conteúdo é o primeiro item focável", async ({ page }) => {
  await page.goto("/")
  await page.keyboard.press("Tab")
  await expect(page.getByRole("link", { name: "Ir para o conteúdo principal" })).toBeFocused()
})

test("validação de formulário associa erro ao campo", async ({ page }) => {
  await page.goto("/login")
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page.getByText("Informe seu e-mail.")).toBeVisible()
  await expect(page.getByLabel("E-mail")).toHaveAttribute("aria-invalid", "true")
})

test("menu em gaveta prende o foco, fecha com Esc e devolve o foco (mobile)", async ({ page, isMobile }) => {
  test.skip(!isMobile, "gaveta só existe em telas pequenas")
  await page.goto("/")
  const trigger = page.getByRole("button", { name: "Menu" })
  await trigger.click()
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden()
  await expect(trigger).toBeFocused()
})

test("filtros em gaveta abrem e aplicam a busca (mobile)", async ({ page, isMobile }) => {
  test.skip(!isMobile, "gaveta só existe em telas pequenas")
  await page.goto("/")
  await page.getByRole("button", { name: /Filtros/ }).click()
  const dialog = page.getByRole("dialog", { name: "Filtros" })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel("Buscar").fill("NFT #01")
  await dialog.getByLabel("Buscar").press("Enter")
  await expect(dialog).toBeHidden()
  await expect(page.getByText("10 NFTs")).toBeVisible()
})

test("skeleton aparece durante carregamento lento", async ({ page }) => {
  await page.goto("/?scenario=slow")
  await expect(page.getByRole("status", { name: "Carregando NFTs" })).toBeVisible()
  await expect(page.locator("main ul li h2").first()).toBeVisible({ timeout: 15_000 })
})

test("falha de rede mostra erro e recupera com nova tentativa", async ({ page }) => {
  await page.goto("/?scenario=flaky")
  await expect(page.getByText("Não foi possível carregar os NFTs.", { exact: false })).toBeVisible({
    timeout: 20_000,
  })
  await page.getByRole("button", { name: "Tentar novamente" }).click()
  await expect(page.locator("main ul li h2").first()).toBeVisible()
})

test("catálogo vazio exibe mensagem", async ({ page }) => {
  await page.goto("/?scenario=empty")
  await expect(page.getByText("Nenhum NFT encontrado para esses filtros.")).toBeVisible()
})
