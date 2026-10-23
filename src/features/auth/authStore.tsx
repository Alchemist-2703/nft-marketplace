import type { Session, User } from "@/types/user"

const STORAGE_KEY = "nft_marketplace_session"

export function getStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session: Session = JSON.parse(raw)
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function setStoredSession(user: User): Session {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const session: Session = { user, expiresAt }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}

export function clearStoredSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}