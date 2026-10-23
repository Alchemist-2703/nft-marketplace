import type { EthString } from "./common"
import type { Network } from "./user"

export interface CartItem {
  nftId: string
  editionId: string
  quantity: number
}

export interface Cart {
  items: CartItem[]
}

export interface AddCartItemInput {
  nftId: string
  editionId: string
  quantity: number
}

export interface QuoteLine {
  nftId: string
  editionId: string
  name: string
  tokenId: string
  editionLabel: string
  image: string
  quantity: number
  unitPriceEth: EthString
  lineTotalEth: EthString
  available: number
  isAvailable: boolean
}

export interface QuoteRequest {
  couponCode?: string | null
  network?: Network
}

export interface Quote {
  id: string
  lines: QuoteLine[]
  couponCode: string | null
  network: Network
  subtotalEth: EthString
  discountEth: EthString
  networkFeeEth: EthString
  totalEth: EthString
  createdAt: string
}
