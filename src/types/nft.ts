import type { EthString } from "./common"

export interface NftEdition {
  id: string
  label: string
  priceEth: EthString
  available: number
}

export interface Nft {
  id: string
  tokenId: string
  name: string
  description: string
  creator: string
  collection: string
  category: string
  attributes: string[]
  images: string[]
  editions: NftEdition[]
  version: number
}

export type NftSort = "price_asc" | "price_desc" | "name_asc" | "newest"

export interface NftListParams {
  q?: string
  category?: string
  minPrice?: EthString
  maxPrice?: EthString
  sort?: NftSort
  page?: number
  pageSize?: number
}