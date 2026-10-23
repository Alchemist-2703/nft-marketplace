import { http, HttpResponse } from "msw"
import { getDb, saveDb } from "../db"
import { getScenario } from "../scenarios"
import { authenticate, errorResponse, latency } from "./utils"

export const favoriteHandlers = [
  http.get("/api/favorites", async ({ request }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }
    return HttpResponse.json(getDb().favorites[auth.user.id] ?? [])
  }),

  http.put("/api/favorites/:nftId", async ({ request, params }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }
    if (getScenario().failFavorites) {
      return errorResponse(503, "TRANSIENT_ERROR", "Serviço indisponível. Tente novamente.")
    }

    const nftId = String(params.nftId)
    const db = getDb()
    if (!db.nfts.some((nft) => nft.id === nftId)) {
      return errorResponse(404, "NOT_FOUND", "NFT não encontrado.")
    }
    const current = db.favorites[auth.user.id] ?? []
    db.favorites[auth.user.id] = current.includes(nftId) ? current : [...current, nftId]
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete("/api/favorites/:nftId", async ({ request, params }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }
    if (getScenario().failFavorites) {
      return errorResponse(503, "TRANSIENT_ERROR", "Serviço indisponível. Tente novamente.")
    }

    const nftId = String(params.nftId)
    const db = getDb()
    db.favorites[auth.user.id] = (db.favorites[auth.user.id] ?? []).filter((id) => id !== nftId)
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),
]
