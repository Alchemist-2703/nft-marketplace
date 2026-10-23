import { http, HttpResponse } from "msw"
import type { ChangePasswordInput, UpdateProfileInput } from "@/types/user"
import { getDb, saveDb } from "../db"
import { authenticate, errorResponse, hashPassword, latency, publicUser } from "./utils"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const AVATAR_PATTERN = /^data:image\/(png|jpeg|webp);base64,/
const MAX_AVATAR_LENGTH = 450_000

function passwordIsValid(value: string): boolean {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)
}

export const profileHandlers = [
  http.get("/api/profile", async ({ request }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }
    return HttpResponse.json(publicUser(auth.user))
  }),

  http.patch("/api/profile", async ({ request }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = (await request.json()) as Partial<UpdateProfileInput>
    const name = body.name?.trim() ?? ""
    const email = body.email?.trim().toLowerCase() ?? ""
    const avatarUrl = body.avatarUrl ?? null

    const fieldErrors: Record<string, string> = {}
    if (name.length < 2) {
      fieldErrors.name = "Informe um nome com ao menos 2 caracteres."
    }
    if (!EMAIL_PATTERN.test(email)) {
      fieldErrors.email = "Informe um e-mail válido."
    }
    if (avatarUrl !== null && (!AVATAR_PATTERN.test(avatarUrl) || avatarUrl.length > MAX_AVATAR_LENGTH)) {
      fieldErrors.avatarUrl = "Use uma imagem PNG, JPG ou WebP de até 300 KB."
    }
    if (Object.keys(fieldErrors).length > 0) {
      return errorResponse(422, "VALIDATION_ERROR", "Dados inválidos.", fieldErrors)
    }

    const db = getDb()
    if (db.users.some((user) => user.email === email && user.id !== auth.user.id)) {
      return errorResponse(409, "CONFLICT", "Este e-mail já está em uso.", {
        email: "Este e-mail já está em uso por outra conta.",
      })
    }

    auth.user.name = name
    auth.user.email = email
    auth.user.avatarUrl = avatarUrl
    saveDb()
    return HttpResponse.json(publicUser(auth.user))
  }),

  http.post("/api/profile/password", async ({ request }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = (await request.json()) as Partial<ChangePasswordInput>
    const currentPassword = body.currentPassword ?? ""
    const newPassword = body.newPassword ?? ""

    const fieldErrors: Record<string, string> = {}
    if ((await hashPassword(currentPassword)) !== auth.user.passwordHash) {
      fieldErrors.currentPassword = "Senha atual incorreta."
    }
    if (!passwordIsValid(newPassword)) {
      fieldErrors.newPassword = "A nova senha deve ter ao menos 8 caracteres, com letras e números."
    } else if (newPassword === currentPassword) {
      fieldErrors.newPassword = "A nova senha deve ser diferente da atual."
    }
    if (Object.keys(fieldErrors).length > 0) {
      return errorResponse(422, "VALIDATION_ERROR", "Não foi possível alterar a senha.", fieldErrors)
    }

    auth.user.passwordHash = await hashPassword(newPassword)
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),
]
