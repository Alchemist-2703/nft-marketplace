import type { EthString } from "./common"
import type { QuoteLine } from "./cart"
import type { Network } from "./user"

export type OrderStatus = "pending" | "confirmed" | "declined"

export interface CreateOrderInput {
  quoteId: string
  walletId: string
  network: Network
}

export interface Order {
  id: string
  status: OrderStatus
  items: QuoteLine[]
  subtotalEth: EthString
  discountEth: EthString
  networkFeeEth: EthString
  totalEth: EthString
  transactionHash: string | null
  explorerUrl: string | null
  declineReason: string | null
  createdAt: string
  version: number
}