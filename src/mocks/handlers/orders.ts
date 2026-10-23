import { delay, http, HttpResponse } from "msw"
import type { CreateOrderInput } from "@/types/order"
import { getDb, saveDb, type OrderRecord } from "../db"
import { buildQuote, hashString, ORDER_RESOLVE_MS, settleOrder, toOrder } from "../engine"
import { scheduleOrderResolution } from "../realtime"
import { getScenario, setScenario } from "../scenarios"
import { authenticate, errorResponse, latency } from "./utils"

export const orderHandlers = [
  http.post("/api/orders", async ({ request }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }

    const key = request.headers.get("Idempotency-Key")
    if (!key) {
      return errorResponse(400, "VALIDATION_ERROR", "O cabeçalho Idempotency-Key é obrigatório.")
    }

    const body = (await request.json()) as CreateOrderInput
    const db = getDb()
    const idempotencyId = `${auth.user.id}:${key}`
    const payloadHash = hashString(
      JSON.stringify([body.quoteId, body.walletId, body.network, body.couponCode ?? null]),
    )

    const existing = db.idempotency[idempotencyId]
    if (existing) {
      if (existing.hash !== payloadHash) {
        return errorResponse(
          409,
          "IDEMPOTENCY_CONFLICT",
          "Esta chave de idempotência já foi usada com outro conteúdo.",
        )
      }
      const previous = db.orders.find((order) => order.id === existing.orderId)
      if (previous) {
        return HttpResponse.json(toOrder(settleOrder(db, previous)), { status: 200 })
      }
    }

    const wallet = db.wallets.find((item) => item.id === body.walletId && item.userId === auth.user.id)
    if (!wallet) {
      return errorResponse(404, "NOT_FOUND", "Carteira não encontrada.")
    }
    if (!wallet.connected) {
      return errorResponse(422, "VALIDATION_ERROR", "Conecte a carteira antes de finalizar.", {
        walletId: "Carteira desconectada.",
      })
    }

    const result = buildQuote(db, `user:${auth.user.id}`, {
      couponCode: body.couponCode,
      network: body.network,
    })
    if (!result.ok) {
      return errorResponse(422, "VALIDATION_ERROR", "Cupom não aplicado.", result.fieldErrors)
    }
    const quote = result.quote
    if (quote.lines.length === 0) {
      return errorResponse(422, "VALIDATION_ERROR", "O carrinho está vazio.")
    }
    if (quote.id !== body.quoteId || quote.lines.some((line) => !line.isAvailable)) {
      return errorResponse(
        409,
        "AVAILABILITY_CONFLICT",
        "Preço ou disponibilidade mudou. Revise o pedido e confirme novamente.",
      )
    }

    const scenario = getScenario()
    const now = Date.now()
    const order: OrderRecord = {
      id: `ord_${crypto.randomUUID().slice(0, 8)}`,
      userId: auth.user.id,
      status: "pending",
      items: quote.lines,
      subtotalEth: quote.subtotalEth,
      discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth,
      totalEth: quote.totalEth,
      network: quote.network,
      walletLabel: wallet.label,
      transactionHash: null,
      explorerUrl: null,
      declineReason: null,
      createdAt: new Date(now).toISOString(),
      version: 1,
      plannedOutcome: scenario.paymentOutcome,
      resolveAt: now + ORDER_RESOLVE_MS,
    }
    db.orders.push(order)
    db.idempotency[idempotencyId] = { hash: payloadHash, orderId: order.id }
    saveDb()
    scheduleOrderResolution(order)

    if (scenario.orderTimeoutOnce) {
      setScenario({ orderTimeoutOnce: false })
      await delay(12_000)
    }
    return HttpResponse.json(toOrder(order), { status: 201 })
  }),

  http.get("/api/orders/:id", async ({ request, params }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }
    const db = getDb()
    const order = db.orders.find((item) => item.id === String(params.id) && item.userId === auth.user.id)
    if (!order) {
      return errorResponse(404, "NOT_FOUND", "Pedido não encontrado.")
    }
    return HttpResponse.json(toOrder(settleOrder(db, order)))
  }),
]
