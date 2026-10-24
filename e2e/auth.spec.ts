import { expect, test } from "@playwright/test"
import { addNftToCart, expireServerSession, login, USERS } from "./helpers"

test("cadastro com e-mail já existente mostra conflito", async ({ page }) => {
  await page.goto("/signup")
  await page.getByLabel("Nome de usuário").fill("novo_usuario")
  await page.getByLabel("E-mail").fill(USERS.ana.email)
  await page.getByLabel("Senha", { exact: true }).fill("Senha@999")
  await page.getByLabel("Confirmar senha").fill("Senha@999")
  await page.getByRole("button", { name: "Criar conta" }).click()
  await expect(page.getByText("Este e-mail já está cadastrado.")).toBeVisible()
})

test("cadastro novo cria a conta e autentica", async ({ page }) => {
  await page.goto("/signup")
  await page.getByLabel("Nome de usuário").fill("maria_teste")
  await page.getByLabel("E-mail").fill("maria@teste.dev")
  await page.getByLabel("Senha", { exact: true }).fill("Senha@999")
  await page.getByLabel("Confirmar senha").fill("Senha@999")
  await page.getByRole("button", { name: "Criar conta" }).click()
  await page.waitForURL((url) => !url.pathname.startsWith("/signup"))
  await page.goto("/profile")
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("maria_teste")
})

test("login inválido mostra erro e login válido volta ao fluxo anterior", async ({ page }) => {
  await page.goto("/checkout")
  await expect(page).toHaveURL(/\/login\?redirect=/)

  await page.getByLabel("E-mail").fill(USERS.ana.email)
  await page.getByLabel("Senha", { exact: true }).fill("errada123")
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible()

  await page.getByLabel("Senha", { exact: true }).fill(USERS.ana.password)
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page).toHaveURL(/\/checkout/)
})

test("logout e troca de usuário não vazam favoritos", async ({ page, isMobile }) => {
  test.skip(isMobile, "logout pelo menu é coberto no desktop")

  await login(page, USERS.ana)
  await page.goto("/nfts/nft-2")
  await page.getByRole("button", { name: /Favoritar/ }).click()
  await expect(page.getByRole("button", { name: /Favoritado/ })).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("mock-db-v1")?.includes('"user-1":["nft-2"]') ?? false),
    )
    .toBe(true)
  await page.reload()
  await expect(page.getByRole("button", { name: /Favoritado/ })).toBeVisible()

  await page.getByRole("button", { name: "Sair" }).click()
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible()
  await login(page, USERS.bruno)
  await page.goto("/nfts/nft-2")
  await expect(page.getByRole("button", { name: /♡ Favoritar/ })).toBeVisible()
})

test("favorito com falha de API faz rollback", async ({ page }) => {
  await login(page, USERS.ana)
  await page.goto("/nfts/nft-3")
  await page.evaluate(() => {
    ;(window as unknown as { __mocks: { setScenario: (v: unknown) => void } }).__mocks.setScenario({
      failFavorites: true,
    })
  })
  await page.getByRole("button", { name: /Favoritar/ }).click()
  await expect(page.getByText("Não foi possível atualizar seus favoritos")).toBeVisible()
  await expect(page.getByRole("button", { name: /♡ Favoritar/ })).toBeVisible()
})

test("sessão expirada durante o checkout redireciona e retoma depois do login", async ({ page }) => {
  await login(page, USERS.ana)
  await addNftToCart(page, "nft-1")
  await page.getByRole("link", { name: "Conectar e finalizar" }).click()
  await expect(page.getByRole("heading", { name: "Pagamento com carteira" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Conectar", exact: true }).first()).toBeVisible()

  await expireServerSession(page)
  await page.getByRole("button", { name: "Conectar", exact: true }).first().click()

  await expect(page).toHaveURL(/\/login\?.*expired=true/)
  await expect(page.getByText("Sua sessão expirou", { exact: false }).first()).toBeVisible()

  await page.getByLabel("E-mail").fill(USERS.ana.email)
  await page.getByLabel("Senha", { exact: true }).fill(USERS.ana.password)
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page.getByRole("heading", { name: "Pagamento com carteira" })).toBeVisible()
})
