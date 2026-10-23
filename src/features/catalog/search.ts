import type { NftSort } from "@/types/nft"

export interface HomeSearch {
  q?: string
  category?: string
  minPrice?: string
  maxPrice?: string
  sort?: NftSort
  page?: number
}

const SORTS: NftSort[] = ["price_asc", "price_desc", "name_asc", "newest"]

function text(value: unknown): string | undefined {
  if (typeof value === "number") {
    return String(value)
  }
  if (typeof value === "string" && value.trim() !== "") {
    return value
  }
  return undefined
}

function price(value: unknown): string | undefined {
  const parsed = text(value)
  return parsed !== undefined && /^\d+(\.\d+)?$/.test(parsed) ? parsed : undefined
}

export function parseHomeSearch(search: Record<string, unknown>): HomeSearch {
  const page = Number(search.page)
  return {
    q: text(search.q),
    category: text(search.category),
    minPrice: price(search.minPrice),
    maxPrice: price(search.maxPrice),
    sort: SORTS.find((item) => item === search.sort),
    page: Number.isInteger(page) && page > 1 ? page : undefined,
  }
}