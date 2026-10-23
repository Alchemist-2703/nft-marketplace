import { expect, test } from "@playwright/test"
import { login, USERS } from "./helpers"

test.describe("perfil e carteiras (desktop)", () => {
  test.skip(({ isMobile }) => isMobile, "mesma lógica no mobile; layout validado em responsive.spec.ts")

  test("perfil: validação, conflito de e-mail, persistência e troca de senha", async ({ page }) => {
    await login(page, USERS.ana)
    await page.goto("/profile")

    await page.getByLabel("Nome", { exact: true }).fill("")
    await page.getByRole("button", { name: "Salvar alterações" }).click()
    await expect(page.getByText("Informe um nome com ao menos 2 caracteres.")).toBeVisible()

    await page.getByLabel("Nome", { exact: true }).fill("Ana Teste")
    await page.getByLabel("E-mail").fill(USERS.bruno.email)
    await page.getByRole("button", { name: "Salvar alterações" }).click()
    await expect(page.getByText("Este e-mail já está em uso por outra conta.")).toBeVisible()

    await page.getByLabel("E-mail").fill(USERS.ana.email)
    await page.getByRole("button", { name: "Salvar alterações" }).click()
    await expect(page.getByText("Alterações salvas.")).toBeVisible()
    await page.reload()
    await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Ana Teste")

    await page.getByLabel("Senha atual").fill("errada123")
    await page.getByLabel("Nova senha").fill("Nova@1234")
    await page.getByLabel("Confirmar nova senha").fill("Nova@1234")
    await page.getByRole("button", { name: "Alterar senha" }).click()
    await expect(page.getByText("Senha atual incorreta.")).toBeVisible()
  })

  test("avatar com tipo inválido é rejeitado", async ({ page }) => {
    await login(page, USERS.ana)
    await page.goto("/profile")
    await page.getByLabel(/Avatar/).setInputFiles({
      name: "arquivo.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("não sou uma imagem"),
    })
    await expect(page.getByText("Use uma imagem PNG, JPG ou WebP.")).toBeVisible()
  })

  test("carteiras: validação de endereço e cadastro da secundária", async ({ page }) => {
    await login(page, USERS.bruno)
    await page.goto("/wallets")

    await page.getByRole("button", { name: "Cadastrar carteira" }).click()
    await page.getByLabel("Apelido").fill("Cofre")
    await page.getByLabel("Endereço da carteira").fill("0x123")
    await page.getByRole("button", { name: "Cadastrar carteira" }).last().click()
    await expect(page.getByText("Endereço inválido.", { exact: false })).toBeVisible()

    await page.getByLabel("Endereço da carteira").fill(`0x${"ab".repeat(20)}`)
    await page.getByRole("button", { name: "Cadastrar carteira" }).last().click()
    await expect(page.getByText("Cofre")).toBeVisible()
  })
})
