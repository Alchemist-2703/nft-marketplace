import Decimal from "decimal.js"
import type { CartItem } from "@/types/cart"
import { getDb, saveDb } from "./db"
import { findEdition } from "./engine"
import { realtimeControls } from "./realtime"
import { applyPreset, getScenario, PRESETS, setScenario } from "./scenarios"

function currentCart(): CartItem[] {
  const db = getDb()
  let token: string | null = null
  try {
    token = JSON.parse(window.localStorage.getItem("nft.session.token") ?? "null") as string | null
  } catch {
    token = null
  }
  const session = token ? db.sessions.find((item) => item.token === token) : undefined
  const key = session
    ? `user:${session.userId}`
    : `guest:${window.localStorage.getItem("nft.guest.id") ?? ""}`
  return db.carts[key] ?? []
}


function openNftId(): string | null {
  const match = window.location.pathname.match(/^\/nfts\/([^/]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function visibleEdition(nftId: string) {
  const nft = getDb().nfts.find((item) => item.id === nftId)
  return nft ? (nft.editions.find((edition) => edition.available > 0) ?? nft.editions[0]) : undefined
}

function scaledPrice(price: string, factor: number): string {
  return new Decimal(price).times(factor).toDecimalPlaces(4).toFixed()
}

let tickerId: number | null = null
let tick = 0

export const controls = {
  presets: PRESETS,
  getScenario,
  setScenario,
  useScenario: applyPreset,
  realtime: realtimeControls,

  bumpCartPrice(percent = 10): boolean {
    const item = currentCart()[0]
    const found = item ? findEdition(getDb(), item.editionId) : undefined
    if (!item || !found) {
      return false
    }
    const next = new Decimal(found.edition.priceEth)
      .times(1 + percent / 100)
      .toDecimalPlaces(4)
      .toFixed()
    return realtimeControls.changeNft(item.editionId, { priceEth: next })
  },


  bumpOpenNft(percent = 10): boolean {
    const nftId = openNftId()
    const edition = nftId ? visibleEdition(nftId) : undefined
    if (!edition) {
      return false
    }
    return realtimeControls.changeNft(edition.id, {
      priceEth: scaledPrice(edition.priceEth, 1 + percent / 100),
    })
  },

  startPriceTicker(intervalMs = 6000): void {
    controls.stopPriceTicker()
    tickerId = window.setInterval(() => {
      tick += 1
      const nfts = getDb().nfts
      const target = openNftId() ?? nfts[(tick * 7) % nfts.length].id
      const edition = visibleEdition(target)
      if (edition) {
        realtimeControls.changeNft(edition.id, {
          priceEth: scaledPrice(edition.priceEth, tick % 2 === 0 ? 1.05 : 0.95),
        })
      }
    }, intervalMs)
  },

  stopPriceTicker(): void {
    if (tickerId !== null) {
      window.clearInterval(tickerId)
      tickerId = null
    }
  },

  isTickerRunning(): boolean {
    return tickerId !== null
  },

  soldOutCartItem(): boolean {
    const item = currentCart()[0]
    return item ? realtimeControls.changeNft(item.editionId, { available: 0 }) : false
  },

  expireSession(): void {
    for (const session of getDb().sessions) {
      session.expiresAt = Date.now() - 1000
    }
    saveDb()
  },

  reset(): void {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.location.reload()
  },
}
