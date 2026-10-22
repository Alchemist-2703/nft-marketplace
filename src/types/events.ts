import type { Order } from "./order"

export interface NftUpdatedEvent {
  eventId: string
  resource: "nft"
  resourceId: string
  version: number
  priceEth: string
  editionId: string
  available: number
}

export interface OrderUpdatedEvent {
  eventId: string
  resource: "order"
  resourceId: string
  version: number
  order: Order
}