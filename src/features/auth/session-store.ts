import { createStore } from "@/lib/store"

export const tokenStore = createStore<string | null>({
  initial: null,
  persist: { key: "nft.session.token", storage: "local" },
})

export const expiredStore = createStore<boolean>({ initial: false })

export const sessionActions = {
  signIn: (token: string) => {
    expiredStore.set(false)
    tokenStore.set(token)
  },
  signOut: () => {
    tokenStore.set(null)
  },
  expire: () => {
    tokenStore.set(null)
    expiredStore.set(true)
  },
  acknowledgeExpired: () => {
    expiredStore.set(false)
  },
}

export function getGuestId(): string {
  const key = "nft.guest.id"
  try {
    const existing = window.localStorage.getItem(key)
    if (existing) {
      return existing
    }
    const created = crypto.randomUUID()
    window.localStorage.setItem(key, created)
    return created
  } catch {
    return "guest-fallback"
  }
}
