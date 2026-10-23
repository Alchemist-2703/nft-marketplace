import { createStore } from "@/lib/store"

export type RealtimeStatus = "connecting" | "online" | "offline"

export const realtimeStatusStore = createStore<RealtimeStatus>({ initial: "connecting" })
