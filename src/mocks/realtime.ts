import { ws } from "msw"
import type { NftUpdatedEvent, OrderUpdatedEvent } from "@/types/events"
import type { Nft } from "@/types/nft"
import { applyNftChange, getDb, type NftChange, type OrderRecord } from "./db"
import { hooks, settleOrder, toOrder } from "./engine"
import { setScenario } from "./scenarios"

interface MockClient {
  userId: string | null
  send: (data: string) => void
  close: () => void
}

const clients = new Set<MockClient>()
let sequence = 0
let lastNftEvent: NftUpdatedEvent | null = null

function nextEventId(): string {
  sequence += 1
  return `evt_${Date.now().toString(36)}_${sequence}`
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
      client.send(`42${JSON.stringify([event, payload])}`)
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

function randomId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 20)
}

function parseClientEvent(packet: string): { name: string; payload: unknown } | null {
  // 42[id opcional]["evento", payload]
  const body = packet.slice(2).replace(/^\d+/, "")
  try {
    const parsed = JSON.parse(body) as unknown[]
    return typeof parsed[0] === "string" ? { name: parsed[0], payload: parsed[1] } : null
  } catch {
    return null
  }
}

function createSocketHandlers() {
  const patterns = ["*"]
  for (const pattern of patterns) {
    try {
      const link = ws.link(pattern)
      return [
        link.addEventListener("connection", ({ client, server }) => {
        if (!client.url.pathname.startsWith("/socket.io")) {
        server.connect()
    
        return
        }

          const mock: MockClient = {
            userId: null,
            send: (data) => client.send(data),
            close: () => client.close(4000, "Conexão encerrada pelo mock"),
          }
          clients.add(mock)
          console.info(`[mock-socket] cliente conectado (total: ${clients.size})`)

          // Engine.IO v4: o servidor abre a sessão e mantém pings periódicos.
          client.send(
            `0${JSON.stringify({
              sid: randomId(),
              upgrades: [],
              pingInterval: 25000,
              pingTimeout: 20000,
              maxPayload: 1000000,
            })}`,
          )
          const keepAlive = window.setInterval(() => client.send("2"), 10_000)

          client.addEventListener("message", (event) => {
            if (typeof event.data !== "string") {
              return
            }
            if (event.data.startsWith("40")) {
              // Socket.IO CONNECT no namespace "/": responde com o id do socket
              client.send(`40${JSON.stringify({ sid: randomId() })}`)
              return
            }
            if (event.data.startsWith("42")) {
              const parsed = parseClientEvent(event.data)
              if (parsed?.name === "session.subscribe") {
                const payload = parsed.payload as { token?: string } | undefined
                mock.userId = userIdFromToken(payload?.token)
              } else if (parsed?.name === "session.unsubscribe") {
                mock.userId = null
              }
            }
          })

          client.addEventListener("close", () => {
            window.clearInterval(keepAlive)
            clients.delete(mock)
            console.info(`[mock-socket] cliente desconectado (total: ${clients.size})`)
          })
        }),
      ]
    } catch (error) {
      console.warn("[mock-socket] padrão de URL não aceito, tentando o próximo:", pattern, error)
    }
  }
  return []
}

export const socketHandlers = createSocketHandlers()

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
