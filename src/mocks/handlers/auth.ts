import { http, HttpResponse } from "msw"
import type { AuthResponse, LoginInput, RegisterInput, Session } from "@/types/user"
import { getDb, saveDb, SESSION_TTL_MS, type UserRecord } from "../db"
import { authenticate, errorResponse, getToken, hashPassword, latency, publicUser } from "./utils"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function openSession(user: UserRecord): AuthResponse {
  const db = getDb()
  const token = crypto.randomUUID()
  const expiresAt = Date.now() + SESSION_TTL_MS
  db.sessions.push({ token, userId: user.id, expiresAt })
  saveDb()
  const session: Session = { user: publicUser(user), expiresAt: new Date(expiresAt).toISOString() }
  return { token, session }
}

export const authHandlers = [
  http.post("/api/auth/register", async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<RegisterInput>
    const name = body.name?.trim() ?? ""
    const email = body.email?.trim().toLowerCase() ?? ""
    const password = body.password ?? ""

    const fieldErrors: Record<string, string> = {}
    if (name.length < 2) {
      fieldErrors.name = "Informe um nome de usuário com ao menos 2 caracteres."
    }
    if (!EMAIL_PATTERN.test(email)) {
      fieldErrors.email = "Informe um e-mail válido."
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      fieldErrors.password = "A senha deve ter ao menos 8 caracteres, com letras e números."
    }
    if (Object.keys(fieldErrors).length > 0) {
      return errorResponse(422, "VALIDATION_ERROR", "Dados inválidos.", fieldErrors)
    }

    const db = getDb()
    if (db.users.some((user) => user.email === email)) {
      return errorResponse(409, "CONFLICT", "Este e-mail já está cadastrado.", {
        email: "Este e-mail já está cadastrado.",
      })
    }

    const user: UserRecord = {
      id: `user-${crypto.randomUUID().slice(0, 8)}`,
      name,
      email,
      avatarUrl: null,
      passwordHash: await hashPassword(password),
    }
    db.users.push(user)
    return HttpResponse.json(openSession(user), { status: 201 })
  }),

  http.post("/api/auth/login", async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<LoginInput>
    const email = body.email?.trim().toLowerCase() ?? ""
    const passwordHash = await hashPassword(body.password ?? "")

    const user = getDb().users.find((item) => item.email === email)
    if (!user || user.passwordHash !== passwordHash) {
      return errorResponse(401, "UNAUTHORIZED", "E-mail ou senha inválidos.")
    }
    return HttpResponse.json(openSession(user))
  }),

  http.get("/api/auth/session", async ({ request }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }
    const session: Session = {
      user: publicUser(auth.user),
      expiresAt: new Date(auth.session.expiresAt).toISOString(),
    }
    return HttpResponse.json(session)
  }),

  http.post("/api/auth/logout", async ({ request }) => {
    await latency()
    const token = getToken(request)
    if (token) {
      const db = getDb()
      db.sessions = db.sessions.filter((session) => session.token !== token)
      saveDb()
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
