import { http, HttpResponse } from "msw"
import type { AddCartItemInput, Cart, CartItem } from "@/types/cart"
import { getDb, saveDb } from "../db"
import { buildQuote, findEdition } from "../engine"
import { authenticate, errorResponse, latency, resolveOwner } from "./utils"

function cartOf(key: string): Cart {
  return { items: getDb().carts[key] ?? [] }
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1
}

export const cartHandlers = [
  http.get("/api/cart", async ({ request }) => {
    await latency()
    const owner = resolveOwner(request)
    if (!owner.ok) {
      return owner.response
    }
    return HttpResponse.json(cartOf(owner.key))
  }),

  http.post("/api/cart/items", async ({ request }) => {
    await latency()
    const owner = resolveOwner(request)
    if (!owner.ok) {
      return owner.response
    }

    const body = (await request.json()) as Partial<AddCartItemInput>
    if (!body.editionId || !isPositiveInteger(body.quantity)) {
      return errorResponse(422, "VALIDATION_ERROR", "Informe uma edição e uma quantidade inteira.")
    }

    const db = getDb()
    const found = findEdition(db, body.editionId)
    if (!found) {
      return errorResponse(404, "NOT_FOUND", "Edição não encontrada.")
    }

    const items = db.carts[owner.key] ?? []
    const existing = items.find((item) => item.editionId === body.editionId)
    const nextQuantity = (existing?.quantity ?? 0) + body.quantity
    if (nextQuantity > found.edition.available) {
      return errorResponse(
        409,
        "AVAILABILITY_CONFLICT",
        found.edition.available === 0
          ? "Esta edição está esgotada."
          : `Só há ${found.edition.available} unidade(s) disponível(is) desta edição.`,
      )
    }

    db.carts[owner.key] = existing
      ? items.map((item) =>
          item.editionId === body.editionId ? { ...item, quantity: nextQuantity } : item,
        )
      : [...items, { nftId: found.nft.id, editionId: found.edition.id, quantity: nextQuantity }]
    saveDb()
    return HttpResponse.json(cartOf(owner.key), { status: 201 })
  }),

  http.patch("/api/cart/items/:editionId", async ({ request, params }) => {
    await latency()
    const owner = resolveOwner(request)
    if (!owner.ok) {
      return owner.response
    }

    const editionId = String(params.editionId)
    const body = (await request.json()) as { quantity?: unknown }
    if (!isPositiveInteger(body.quantity)) {
      return errorResponse(422, "VALIDATION_ERROR", "A quantidade deve ser um número inteiro maior que zero.")
    }

    const db = getDb()
    const items = db.carts[owner.key] ?? []
    if (!items.some((item) => item.editionId === editionId)) {
      return errorResponse(404, "NOT_FOUND", "Item não encontrado no carrinho.")
    }
    const found = findEdition(db, editionId)
    if (!found || body.quantity > found.edition.available) {
      return errorResponse(
        409,
        "AVAILABILITY_CONFLICT",
        `Só há ${found?.edition.available ?? 0} unidade(s) disponível(is) desta edição.`,
      )
    }

    db.carts[owner.key] = items.map((item) =>
      item.editionId === editionId ? { ...item, quantity: body.quantity as number } : item,
    )
    saveDb()
    return HttpResponse.json(cartOf(owner.key))
  }),

  http.delete("/api/cart/items/:editionId", async ({ request, params }) => {
    await latency()
    const owner = resolveOwner(request)
    if (!owner.ok) {
      return owner.response
    }

    const editionId = String(params.editionId)
    const db = getDb()
    db.carts[owner.key] = (db.carts[owner.key] ?? []).filter((item) => item.editionId !== editionId)
    saveDb()
    return HttpResponse.json(cartOf(owner.key))
  }),

  http.post("/api/cart/merge", async ({ request }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }

    const db = getDb()
    const guestKey = `guest:${request.headers.get("X-Guest-Id") ?? "anonymous"}`
    const userKey = `user:${auth.user.id}`
    const merged: CartItem[] = [...(db.carts[userKey] ?? [])]

    for (const guestItem of db.carts[guestKey] ?? []) {
      const found = findEdition(db, guestItem.editionId)
      if (!found) {
        continue
      }
      const index = merged.findIndex((item) => item.editionId === guestItem.editionId)
      const current = index >= 0 ? merged[index].quantity : 0
      const quantity = Math.min(current + guestItem.quantity, found.edition.available)
      if (quantity < 1) {
        continue
      }
      if (index >= 0) {
        merged[index] = { ...merged[index], quantity }
      } else {
        merged.push({ ...guestItem, quantity })
      }
    }

    db.carts[userKey] = merged
    delete db.carts[guestKey]
    saveDb()
    return HttpResponse.json(cartOf(userKey))
  }),

  http.post("/api/quote", async ({ request }) => {
    await latency()
    const owner = resolveOwner(request)
    if (!owner.ok) {
      return owner.response
    }
    const body = (await request.json()) as { couponCode?: string | null; network?: "ethereum" | "polygon" | "arbitrum" }
    const result = buildQuote(getDb(), owner.key, body)
    if (!result.ok) {
      return errorResponse(422, "VALIDATION_ERROR", "Cupom não aplicado.", result.fieldErrors)
    }
    return HttpResponse.json(result.quote)
  }),
]
