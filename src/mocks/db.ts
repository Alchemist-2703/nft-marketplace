import type { CartItem } from "@/types/cart"
import type { Nft } from "@/types/nft"
import type { Order } from "@/types/order"
import { createNftFixtures } from "./fixtures/nfts"
import {
  createUserFixtures,
  createWalletFixtures,
  type UserRecord,
  type WalletRecord,
} from "./fixtures/users"

export type { UserRecord, WalletRecord }

export const SESSION_TTL_MS = 8 * 60 * 60 * 1000

export interface SessionRecord {
  token: string
  userId: string
  expiresAt: number
}

export interface OrderRecord extends Order {
  userId: string
  plannedOutcome: "confirm" | "decline"
  resolveAt: number
}

export interface IdempotencyRecord {
  hash: string
  orderId: string
}

interface PersistedState {
  users: UserRecord[]
  sessions: SessionRecord[]
  favorites: Record<string, string[]>
  carts: Record<string, CartItem[]>
  wallets: WalletRecord[]
  orders: OrderRecord[]
  idempotency: Record<string, IdempotencyRecord>
  sold: Record<string, number>
  prices: Record<string, string>
  stockAdjust: Record<string, number>
  nftVersions: Record<string, number>
}

export interface Db extends PersistedState {
  nfts: Nft[]
}

const STORAGE_KEY = "mock-db-v1"

function initialState(): PersistedState {
  return {
    users: createUserFixtures(),
    sessions: [],
    favorites: {},
    carts: {},
    wallets: createWalletFixtures(),
    orders: [],
    idempotency: {},
    sold: {},
    prices: {},
    stockAdjust: {},
    nftVersions: {},
  }
}

let baseStock: Map<string, number> | null = null

function getBaseStock(): Map<string, number> {
  if (!baseStock) {
    baseStock = new Map()
    for (const nft of createNftFixtures()) {
      for (const edition of nft.editions) {
        baseStock.set(edition.id, edition.available)
      }
    }
  }
  return baseStock
}

function buildNfts(state: PersistedState): Nft[] {
  return createNftFixtures().map((nft) => ({
    ...nft,
    version: state.nftVersions[nft.id] ?? nft.version,
    editions: nft.editions.map((edition) => ({
      ...edition,
      priceEth: state.prices[edition.id] ?? edition.priceEth,
      available: Math.max(
        0,
        edition.available - (state.sold[edition.id] ?? 0) + (state.stockAdjust[edition.id] ?? 0),
      ),
    })),
  }))
}

function load(): Db {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const state = { ...initialState(), ...(JSON.parse(raw) as Partial<PersistedState>) }
      return { ...state, nfts: buildNfts(state) }
    }
  } catch {
    // estado salvo corrompido: recomeça do cenário conhecido
  }
  const state = initialState()
  return { ...state, nfts: buildNfts(state) }
}

let db: Db | null = null

export function getDb(): Db {
  if (!db) {
    db = load()
  }
  return db
}

export function saveDb(): void {
  const current = getDb()
  const state: PersistedState = {
    users: current.users,
    sessions: current.sessions,
    favorites: current.favorites,
    carts: current.carts,
    wallets: current.wallets,
    orders: current.orders,
    idempotency: current.idempotency,
    sold: current.sold,
    prices: current.prices,
    stockAdjust: current.stockAdjust,
    nftVersions: current.nftVersions,
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // sem persistência: o estado vale apenas até o próximo refresh
  }
}

export function resetDb(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // nada a fazer
  }
  db = null
  getDb()
}

export interface NftChange {
  priceEth?: string
  available?: number
}

export function applyNftChange(editionId: string, change: NftChange): { nft: Nft } | null {
  const current = getDb()
  for (const nft of current.nfts) {
    const edition = nft.editions.find((item) => item.id === editionId)
    if (!edition) {
      continue
    }
    if (change.priceEth !== undefined) {
      edition.priceEth = change.priceEth
      current.prices[editionId] = change.priceEth
    }
    if (change.available !== undefined) {
      const available = Math.max(0, Math.floor(change.available))
      edition.available = available
      current.stockAdjust[editionId] =
        available - ((getBaseStock().get(editionId) ?? 0) - (current.sold[editionId] ?? 0))
    }
    nft.version += 1
    current.nftVersions[nft.id] = nft.version
    saveDb()
    return { nft }
  }
  return null
}
