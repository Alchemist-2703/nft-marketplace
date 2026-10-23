import { delay, http, HttpResponse } from "msw"
import { getScenario, type Scenario } from "./scenarios"
import { errorResponse } from "./handlers/utils"

let requestCounter = 0
let listCounter = 0
let failedCount = 0
let lastEpoch = -1

function pseudoRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function inScope(scope: Scenario["failureScope"], pathname: string, method: string): boolean {
  switch (scope) {
    case "all":
      return true
    case "catalog":
      return pathname.startsWith("/api/nfts") && method === "GET"
    case "cart":
      return pathname.startsWith("/api/cart") || pathname.startsWith("/api/quote")
    case "orders":
      return pathname.startsWith("/api/orders")
    case "auth":
      return pathname.startsWith("/api/auth")
  }
}

function failureResponse(mode: Scenario["failureMode"]): Response | null {
  switch (mode) {
    case "network_error":
      return HttpResponse.error()
    case "http_500":
      return errorResponse(500, "TRANSIENT_ERROR", "Erro interno simulado.")
    case "http_503":
      return errorResponse(503, "TRANSIENT_ERROR", "Serviço indisponível (simulado).")
    case "http_429":
      return HttpResponse.json(
        { code: "TRANSIENT_ERROR", message: "Muitas requisições. Tente em instantes." },
        { status: 429, headers: { "Retry-After": "2" } },
      )
    case "http_403":
      return errorResponse(403, "FORBIDDEN", "Você não tem permissão para esta ação.")
    case "none":
      return null
  }
}

export const chaosHandlers = [
  http.all("/api/*", async ({ request }) => {
    const scenario = getScenario()
    if (scenario.epoch !== lastEpoch) {
      lastEpoch = scenario.epoch
      requestCounter = 0
      listCounter = 0
      failedCount = 0
    }

    const url = new URL(request.url)
    const isList = request.method === "GET" && url.pathname === "/api/nfts"
    requestCounter += 1

    let wait = scenario.latencyMs
    if (scenario.jitterMs > 0) {
      wait += Math.round(pseudoRandom(scenario.seed + requestCounter) * scenario.jitterMs)
    }
    if (scenario.outOfOrder && isList) {
      listCounter += 1
      wait = listCounter % 2 === 1 ? 1800 : 100
    }
    if (wait > 0) {
      await delay(wait)
    }

    if (
      scenario.failureMode !== "none" &&
      inScope(scenario.failureScope, url.pathname, request.method) &&
      (scenario.failFirst === 0 || failedCount < scenario.failFirst)
    ) {
      failedCount += 1
      return failureResponse(scenario.failureMode) ?? undefined
    }

    if (scenario.emptyCatalog && isList) {
      return HttpResponse.json({ items: [], page: 1, pageSize: 12, total: 0, totalPages: 1 })
    }

    return undefined
  }),
]
