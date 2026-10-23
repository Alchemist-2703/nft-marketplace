import { http, HttpResponse } from "msw"
import type { Network, Wallet, WalletInput } from "@/types/user"
import { getDb, saveDb, type WalletRecord } from "../db"
import { getScenario } from "../scenarios"
import { authenticate, errorResponse, latency } from "./utils"

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/
const NETWORKS: Network[] = ["ethereum", "polygon", "arbitrum"]

function toWallet(record: WalletRecord): Wallet {
  return {
    id: record.id,
    kind: record.kind,
    address: record.address,
    network: record.network,
    label: record.label,
    connected: record.connected,
  }
}

function validate(body: Partial<WalletInput>): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  const label = body.label?.trim() ?? ""
  if (label.length < 2 || label.length > 30) {
    fieldErrors.label = "O apelido deve ter entre 2 e 30 caracteres."
  }
  if (!ADDRESS_PATTERN.test(body.address ?? "")) {
    fieldErrors.address = "Endereço inválido. Use 0x seguido de 40 caracteres hexadecimais."
  }
  if (!body.network || !NETWORKS.includes(body.network)) {
    fieldErrors.network = "Selecione uma rede válida."
  }
  return fieldErrors
}

export const walletHandlers = [
  http.get("/api/wallets", async ({ request }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }
    const wallets = getDb().wallets.filter((wallet) => wallet.userId === auth.user.id)
    return HttpResponse.json(wallets.map(toWallet))
  }),

  http.post("/api/wallets", async ({ request }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = (await request.json()) as Partial<WalletInput>
    const fieldErrors = validate(body)
    if (body.kind !== "primary" && body.kind !== "secondary") {
      fieldErrors.kind = "Escolha carteira principal ou secundária."
    }
    if (Object.keys(fieldErrors).length > 0) {
      return errorResponse(422, "VALIDATION_ERROR", "Dados inválidos.", fieldErrors)
    }

    const db = getDb()
    const own = db.wallets.filter((wallet) => wallet.userId === auth.user.id)
    if (own.some((wallet) => wallet.kind === body.kind)) {
      return errorResponse(409, "CONFLICT", "Você já possui uma carteira desse tipo.", {
        kind: "Você já possui uma carteira desse tipo. Edite a existente.",
      })
    }
    if (own.some((wallet) => wallet.address.toLowerCase() === body.address?.toLowerCase())) {
      return errorResponse(409, "CONFLICT", "Este endereço já está cadastrado.", {
        address: "Este endereço já está cadastrado em outra carteira sua.",
      })
    }

    const record: WalletRecord = {
      id: `wallet-${crypto.randomUUID().slice(0, 8)}`,
      userId: auth.user.id,
      kind: body.kind as WalletInput["kind"],
      label: body.label!.trim(),
      address: body.address!,
      network: body.network as Network,
      connected: false,
    }
    db.wallets.push(record)
    saveDb()
    return HttpResponse.json(toWallet(record), { status: 201 })
  }),

  http.patch("/api/wallets/:id", async ({ request, params }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }

    const db = getDb()
    const wallet = db.wallets.find((item) => item.id === String(params.id) && item.userId === auth.user.id)
    if (!wallet) {
      return errorResponse(404, "NOT_FOUND", "Carteira não encontrada.")
    }

    const body = (await request.json()) as Partial<WalletInput>
    const fieldErrors = validate(body)
    if (Object.keys(fieldErrors).length > 0) {
      return errorResponse(422, "VALIDATION_ERROR", "Dados inválidos.", fieldErrors)
    }
    const duplicated = db.wallets.some(
      (item) =>
        item.userId === auth.user.id &&
        item.id !== wallet.id &&
        item.address.toLowerCase() === body.address?.toLowerCase(),
    )
    if (duplicated) {
      return errorResponse(409, "CONFLICT", "Este endereço já está cadastrado.", {
        address: "Este endereço já está cadastrado em outra carteira sua.",
      })
    }

    if (wallet.address !== body.address) {
      wallet.connected = false
    }
    wallet.label = body.label!.trim()
    wallet.address = body.address!
    wallet.network = body.network as Network
    saveDb()
    return HttpResponse.json(toWallet(wallet))
  }),

  http.post("/api/wallets/:id/connect", async ({ request, params }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }
    const wallet = getDb().wallets.find(
      (item) => item.id === String(params.id) && item.userId === auth.user.id,
    )
    if (!wallet) {
      return errorResponse(404, "NOT_FOUND", "Carteira não encontrada.")
    }
    if (getScenario().walletRefuses) {
      return errorResponse(403, "FORBIDDEN", "A carteira recusou a conexão.")
    }
    wallet.connected = true
    saveDb()
    return HttpResponse.json(toWallet(wallet))
  }),

  http.delete("/api/wallets/:id/connection", async ({ request, params }) => {
    await latency()
    const auth = authenticate(request)
    if (!auth.ok) {
      return auth.response
    }
    const wallet = getDb().wallets.find(
      (item) => item.id === String(params.id) && item.userId === auth.user.id,
    )
    if (!wallet) {
      return errorResponse(404, "NOT_FOUND", "Carteira não encontrada.")
    }
    wallet.connected = false
    saveDb()
    return HttpResponse.json(toWallet(wallet))
  }),
]
