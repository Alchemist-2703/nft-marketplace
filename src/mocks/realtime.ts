import { ws } from "msw"
import { toSocketIo } from "@mswjs/socket.io-binding"
import type { NftUpdatedEvent, OrderUpdatedEvent } from "@/types/events"
import type { Nft } from "@/types/nft"
import { applyNftChange, getDb, type NftChange, type OrderRecord } from "./db"
import { hooks, settleOrder, toOrder } from "./engine"
import { getScenario, setScenario } from "./scenarios"

type SocketIoConnection = ReturnType<typeof toSocketIo>

interface MockClient {
  io: SocketIoConnection
  userId: string | null
  close: () => void
}

const clients = new Set<MockClient>()
let sequence = 0
let lastNftEvent: NftUpdatedEvent | null = null

function nextEventId(): string {
  sequence += 1
  return `evt_${Date.now().toString(36)}_${sequence}`
}

function lastArgument(args: unknown[]): unknown {
  return args[args.length - 1]
}

function userIdFromToken(token: string | undefined): string | null {
  if (!token) {
    return null
  }
  const session = getDb().sessions.find((item) => item.token === token)
  return session && session.expiresAt > Date.now() ? session.userId : null
}

function broadcast(event: string, payload: unknown, filter?: (client: MockClient) => boolean): void {
  for (const client of clients) {
    if (!filter || filter(client)) {
      client.io.client.emit(event, payload)
    }
  }
}

function buildNftEvent(nft: Nft, editionId: string): NftUpdatedEvent | null {
  const edition = nft.editions.find((item) => item.id === editionId)
  if (!edition) {
    return null
  }
  return {
    eventId: nextEventId(),
    resource: "nft",
    resourceId: nft.id,
    version: nft.version,
    editionId,
    priceEth: edition.priceEth,
    available: edition.available,
  }
}

export function emitNftUpdated(nft: Nft, editionId: string): void {
  const event = buildNftEvent(nft, editionId)
  if (event) {
    lastNftEvent = event
    broadcast("nft.updated", event)
  }
}

export function emitOrderUpdated(order: OrderRecord): void {
  const event: OrderUpdatedEvent = {
    eventId: nextEventId(),
    resource: "order",
    resourceId: order.id,
    version: order.version,
    order: toOrder(order),
  }
  broadcast("order.updated", event, (client) => client.userId === order.userId)
}

hooks.onEditionChanged = emitNftUpdated
hooks.onOrderSettled = emitOrderUpdated

const socketLink = ws.link("*/socket.io/")

export const socketHandlers = [
  socketLink.addEventListener("connection", (connection) => {
    if (getScenario().socketBlocked) {
      connection.client.close(4001, "Tempo real indisponível (cenário)")
      return
    }

    const io = toSocketIo(connection as unknown as Parameters<typeof toSocketIo>[0])
    const client: MockClient = {
      io,
      userId: null,
      close: () => connection.client.close(4000, "Conexão encerrada pelo mock"),
    }
    clients.add(client)

    // Ping do Engine.IO enviado manualmente: o cliente espera pings do servidor
    // e, sem eles, derrubaria a conexão por "ping timeout".
    const keepAlive = window.setInterval(() => connection.client.send("2"), 10_000)

    io.client.on("session.subscribe", (...args: unknown[]) => {
      const payload = lastArgument(args) as { token?: string } | undefined
      client.userId = userIdFromToken(payload?.token)
    })
    io.client.on("session.unsubscribe", () => {
      client.userId = null
    })

    connection.client.addEventListener("close", () => {
      window.clearInterval(keepAlive)
      clients.delete(client)
    })
  }),
]

const timers = new Map<string, number>()

export function scheduleOrderResolution(order: OrderRecord): void {
  window.clearTimeout(timers.get(order.id))
  const remaining = Math.max(0, order.resolveAt - Date.now())
  timers.set(
    order.id,
    window.setTimeout(() => {
      timers.delete(order.id)
      settleOrder(getDb(), order)
    }, remaining + 50),
  )
}

export function resumePendingOrders(): void {
  for (const order of getDb().orders) {
    if (order.status === "pending") {
      scheduleOrderResolution(order)
    }
  }
}

export const realtimeControls = {
  connectedClients: () => clients.size,

  changeNft(editionId: string, change: NftChange): boolean {
    const result = applyNftChange(editionId, change)
    if (!result) {
      return false
    }
    emitNftUpdated(result.nft, editionId)
    return true
  },

  replayLastEvent(): boolean {
    if (!lastNftEvent) {
      return false
    }
    broadcast("nft.updated", lastNftEvent)
    return true
  },

  emitStaleEvent(): void {
    const base = lastNftEvent ?? {
      eventId: "",
      resource: "nft" as const,
      resourceId: "nft-1",
      version: 1,
      editionId: "nft-1-common",
      priceEth: "0.00",
      available: 0,
    }
    broadcast("nft.updated", {
      ...base,
      eventId: nextEventId(),
      version: Math.max(0, base.version - 1),
      priceEth: "99.99",
    })
  },

  dropConnections(): void {
    for (const client of clients) {
      client.close()
    }
  },

  setBlocked(blocked: boolean): void {
    setScenario({ socketBlocked: blocked })
    if (blocked) {
      realtimeControls.dropConnections()
    }
  },
}
