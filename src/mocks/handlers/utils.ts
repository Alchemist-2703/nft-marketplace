import { HttpResponse } from "msw"
import type { ApiError, ApiErrorCode } from "@/types/common"
import type { User } from "@/types/user"
import { getDb, saveDb, type SessionRecord, type UserRecord } from "../db"

// A latência é aplicada em um único lugar: o handler de caos (../chaos.ts).
export async function latency(): Promise<void> {
  return undefined
}

export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
): Response {
  const body: ApiError = { code, message, fieldErrors }
  return HttpResponse.json(body, { status })
}

export function publicUser(record: UserRecord): User {
  return { id: record.id, name: record.name, email: record.email, avatarUrl: record.avatarUrl }
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`kurio-demo:${password}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export function getToken(request: Request): string | null {
  const header = request.headers.get("Authorization")
  return header?.startsWith("Bearer ") ? header.slice(7) : null
}

export type AuthResult =
  | { ok: true; user: UserRecord; session: SessionRecord }
  | { ok: false; response: Response }

export function authenticate(request: Request): AuthResult {
  const token = getToken(request)
  if (!token) {
    return { ok: false, response: errorResponse(401, "UNAUTHORIZED", "Faça login para continuar.") }
  }

  const db = getDb()
  const expired = () => {
    db.sessions = db.sessions.filter((item) => item.token !== token)
    saveDb()
    return {
      ok: false as const,
      response: errorResponse(401, "SESSION_EXPIRED", "Sua sessão expirou. Entre novamente."),
    }
  }

  const session = db.sessions.find((item) => item.token === token)
  if (!session || session.expiresAt <= Date.now()) {
    return expired()
  }
  const user = db.users.find((item) => item.id === session.userId)
  if (!user) {
    return expired()
  }
  return { ok: true, user, session }
}

export type OwnerResult =
  | { ok: true; key: string; userId: string | null }
  | { ok: false; response: Response }

export function resolveOwner(request: Request): OwnerResult {
  if (getToken(request)) {
    const auth = authenticate(request)
    return auth.ok ? { ok: true, key: `user:${auth.user.id}`, userId: auth.user.id } : auth
  }
  const guestId = request.headers.get("X-Guest-Id") ?? "anonymous"
  return { ok: true, key: `guest:${guestId}`, userId: null }
}
