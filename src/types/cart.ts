import type { EthString } from "./common"

export interface CartItem {
  nftId: string
  editionId: string
  quantity: number
}

export interface Cart {
  items: CartItem[]
}

export interface QuoteLine {
  nftId: string
  editionId: string
  name: string
  quantity: number
  unitPriceEth: EthString
  lineTotalEth: EthString
  available: number
  isAvailable: boolean
}

export interface Quote {
  id: string
  lines: QuoteLine[]
  couponCode: string | null
  subtotalEth: EthString
  discountEth: EthString
  networkFeeEth: EthString
  totalEth: EthString
  createdAt: string
}