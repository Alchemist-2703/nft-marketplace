import Decimal from "decimal.js"
import type { Quote, QuoteLine, QuoteRequest } from "@/types/cart"
import type { Nft, NftEdition } from "@/types/nft"
import type { Order } from "@/types/order"
import type { Network } from "@/types/user"
import { applyNftChange, saveDb, type Db, type OrderRecord } from "./db"

export const ORDER_RESOLVE_MS = 3000

export const hooks: {
  onOrderSettled?: (order: OrderRecord) => void
  onEditionChanged?: (nft: Nft, editionId: string) => void
} = {}

interface Coupon {
  percent: number
  expired: boolean
}

const COUPONS: Record<string, Coupon> = {
  WELCOME10: { percent: 10, expired: false },
  EXPIRED10: { percent: 10, expired: true },
}

const NETWORK_FEES: Record<Network, string> = {
  ethereum: "0.016",
  polygon: "0.002",
  arbitrum: "0.004",
}

export function hashString(value: string): string {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0
  }
  return (hash >>> 0).toString(16)
}

function randomHex(length: number): string {
  const bytes = new Uint8Array(length / 2)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export function findEdition(
  db: Db,
  editionId: string,
): { nft: Nft; edition: NftEdition } | undefined {
  for (const nft of db.nfts) {
    const edition = nft.editions.find((item) => item.id === editionId)
    if (edition) {
      return { nft, edition }
    }
  }
  return undefined
}

export type QuoteResult =
  | { ok: true; quote: Quote }
  | { ok: false; fieldErrors: Record<string, string> }

export function buildQuote(db: Db, ownerKey: string, request: QuoteRequest): QuoteResult {
  const network: Network =
    request.network && request.network in NETWORK_FEES ? request.network : "ethereum"

  const rawCode = request.couponCode?.trim().toUpperCase() ?? ""
  let percent = 0
  let couponCode: string | null = null

  if (rawCode) {
    const coupon: Coupon | undefined = COUPONS[rawCode]
    if (!coupon) {
      return { ok: false, fieldErrors: { couponCode: "Cupom inválido." } }
    }
    if (coupon.expired) {
      return { ok: false, fieldErrors: { couponCode: "Cupom expirado." } }
    }
    percent = coupon.percent
    couponCode = rawCode
  }

  const lines: QuoteLine[] = []
  for (const item of db.carts[ownerKey] ?? []) {
    const found = findEdition(db, item.editionId)
    if (!found) {
      continue
    }
    const { nft, edition } = found
    lines.push({
      nftId: nft.id,
      editionId: edition.id,
      name: nft.name,
      tokenId: nft.tokenId,
      editionLabel: edition.label,
      image: nft.images[0],
      quantity: item.quantity,
      unitPriceEth: edition.priceEth,
      lineTotalEth: new Decimal(edition.priceEth).times(item.quantity).toFixed(),
      available: edition.available,
      isAvailable: edition.available >= item.quantity,
    })
  }

  const subtotal = lines.reduce((sum, line) => sum.plus(line.lineTotalEth), new Decimal(0))
  const discount = subtotal.times(percent).dividedBy(100).toDecimalPlaces(6, Decimal.ROUND_DOWN)
  const fee = lines.length > 0 ? new Decimal(NETWORK_FEES[network]) : new Decimal(0)
  const total = subtotal.minus(discount).plus(fee)

  const fingerprint = JSON.stringify({
    lines: lines.map((line) => [line.editionId, line.quantity, line.unitPriceEth, line.available]),
    couponCode,
    network,
    total: total.toFixed(),
  })

  return {
    ok: true,
    quote: {
      id: `q_${hashString(fingerprint)}`,
      lines,
      couponCode,
      network,
      subtotalEth: subtotal.toFixed(),
      discountEth: discount.toFixed(),
      networkFeeEth: fee.toFixed(),
      totalEth: total.toFixed(),
      createdAt: new Date().toISOString(),
    },
  }
}

export function settleOrder(db: Db, order: OrderRecord): OrderRecord {
  if (order.status !== "pending" || Date.now() < order.resolveAt) {
    return order
  }

  if (order.plannedOutcome === "decline") {
    order.status = "declined"
    order.declineReason = "Pagamento recusado pela carteira (simulação)."
  } else {
    const hash = `0x${randomHex(64)}`
    order.status = "confirmed"
    order.transactionHash = hash
    order.explorerUrl = `https://etherscan.io/tx/${hash}`

    for (const line of order.items) {
      const found = findEdition(db, line.editionId)
      if (found) {
        const changed = applyNftChange(line.editionId, {
          available: Math.max(0, found.edition.available - line.quantity),
        })
        if (changed) {
          hooks.onEditionChanged?.(changed.nft, line.editionId)
        }
      }
    }

    const cartKey = `user:${order.userId}`
    db.carts[cartKey] = (db.carts[cartKey] ?? [])
      .map((item) => {
        const bought = order.items.find((line) => line.editionId === item.editionId)
        return bought ? { ...item, quantity: item.quantity - bought.quantity } : item
      })
      .filter((item) => item.quantity > 0)
  }

  order.version += 1
  saveDb()
  hooks.onOrderSettled?.(order)
  return order
}

export function toOrder(record: OrderRecord): Order {
  return {
    id: record.id,
    status: record.status,
    items: record.items,
    subtotalEth: record.subtotalEth,
    discountEth: record.discountEth,
    networkFeeEth: record.networkFeeEth,
    totalEth: record.totalEth,
    network: record.network,
    walletLabel: record.walletLabel,
    transactionHash: record.transactionHash,
    explorerUrl: record.explorerUrl,
    declineReason: record.declineReason,
    createdAt: record.createdAt,
    version: record.version,
  }
}
