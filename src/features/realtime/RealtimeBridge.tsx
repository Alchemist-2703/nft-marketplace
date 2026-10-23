import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { Socket } from "socket.io-client"
import type { NftUpdatedEvent, OrderUpdatedEvent } from "@/types/events"
import { useSession } from "../auth/queries"
import { tokenStore } from "../auth/session-store"
import { useStore } from "@/lib/store"
import { applyNftUpdated, applyOrderUpdated, reconcileAll } from "./apply-events"
import { createEventGuard } from "./guard"
import { clearNotices } from "./notices-store"
import { connectSocket } from "./socket"
import { realtimeStatusStore } from "./status-store"

export function RealtimeBridge() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const token = useStore(tokenStore, (value) => value)
  const userId = user?.id ?? null

  useEffect(() => {
    let disposed = false
    let socket: Socket | undefined
    let hasConnectedBefore = false
    const guard = createEventGuard()

    realtimeStatusStore.set("connecting")

    void connectSocket().then((created) => {
      if (disposed) {
        created.disconnect()
        return
      }
      socket = created

      created.on("connect", () => {
        realtimeStatusStore.set("online")
        if (token && userId) {
          created.emit("session.subscribe", { token })
        }
        if (hasConnectedBefore) {
          reconcileAll(queryClient)
        }
        hasConnectedBefore = true
      })
      created.on("disconnect", () => realtimeStatusStore.set("offline"))
      created.on("connect_error", () => realtimeStatusStore.set("offline"))

      created.on("nft.updated", (event: NftUpdatedEvent) => {
        if (guard.accept(event)) {
          applyNftUpdated(queryClient, event)
        }
      })
      created.on("order.updated", (event: OrderUpdatedEvent) => {
        if (userId && guard.accept(event)) {
          applyOrderUpdated(queryClient, userId, event)
        }
      })
    })

    return () => {
      disposed = true
      if (socket) {
        socket.emit("session.unsubscribe")
        socket.off()
        socket.disconnect()
      }
      if (!userId) {
        clearNotices()
      }
    }
  }, [queryClient, token, userId])

  return null
}
