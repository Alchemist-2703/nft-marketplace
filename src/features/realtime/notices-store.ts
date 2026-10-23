import { createStore } from "@/lib/store"

export interface RealtimeNotice {
  id: string
  text: string
  tone: "info" | "warning"
}

export const noticesStore = createStore<RealtimeNotice[]>({ initial: [] })

export function pushNotice(text: string, tone: RealtimeNotice["tone"] = "info"): void {
  noticesStore.set((previous) =>
    [...previous.filter((item) => item.text !== text), { id: crypto.randomUUID(), text, tone }].slice(-3),
  )
}

export function dismissNotice(id: string): void {
  noticesStore.set((previous) => previous.filter((item) => item.id !== id))
}

export function clearNotices(): void {
  noticesStore.set([])
}
