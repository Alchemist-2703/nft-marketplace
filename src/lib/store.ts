import { useSyncExternalStore } from "react"

export interface Store<T> {
  get: () => T
  set: (next: T | ((previous: T) => T)) => void
  subscribe: (listener: () => void) => () => void
}

type StorageKind = "local" | "session"

interface StoreOptions<T> {
  initial: T
  persist?: { key: string; storage: StorageKind }
}

function getStorage(kind: StorageKind): Storage | undefined {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage
  } catch {
    return undefined
  }
}

export function createStore<T>({ initial, persist }: StoreOptions<T>): Store<T> {
  const storage = persist ? getStorage(persist.storage) : undefined
  let state = initial

  if (storage && persist) {
    try {
      const raw = storage.getItem(persist.key)
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw)
        const isObject = typeof initial === "object" && initial !== null
        state = (isObject ? { ...initial, ...(parsed as object) } : parsed) as T
      }
    } catch {
      state = initial
    }
  }

  const listeners = new Set<() => void>()

  return {
    get: () => state,
    set: (next) => {
      state = typeof next === "function" ? (next as (previous: T) => T)(state) : (next as T)
      if (storage && persist) {
        try {
          storage.setItem(persist.key, JSON.stringify(state))
        } catch {
          // armazenamento indisponível: o estado segue apenas em memória
        }
      }
      listeners.forEach((listener) => listener())
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()))
}
