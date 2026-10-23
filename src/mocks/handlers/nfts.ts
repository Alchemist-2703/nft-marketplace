import { http, HttpResponse } from "msw"
import Decimal from "decimal.js"
import type { ApiError, Paginated } from "@/types/common"
import type { Nft, NftSort } from "@/types/nft"
import { getDb } from "../db"

function lowestPrice(nft: Nft): Decimal {
  return Decimal.min(...nft.editions.map((edition) => new Decimal(edition.priceEth)))
}

function sortNfts(nfts: Nft[], sort: NftSort): Nft[] {
  const sorted = [...nfts]
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => lowestPrice(a).comparedTo(lowestPrice(b)))
    case "price_desc":
      return sorted.sort((a, b) => lowestPrice(b).comparedTo(lowestPrice(a)))
    case "name_asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case "newest":
      return sorted.reverse()
  }
}

export const nftHandlers = [
  http.get("/api/nfts", ({ request }) => {
    const params = new URL(request.url).searchParams
    const q = params.get("q")?.trim().toLowerCase() ?? ""
    const category = params.get("category")
    const minPrice = params.get("minPrice")
    const maxPrice = params.get("maxPrice")
    const sort = (params.get("sort") ?? "newest") as NftSort
    const page = Math.max(1, Number(params.get("page") ?? 1))
    const pageSize = Math.max(1, Number(params.get("pageSize") ?? 12))

    let result = getDb().nfts

    if (q) {
      result = result.filter(
        (nft) => nft.name.toLowerCase().includes(q) || nft.creator.toLowerCase().includes(q),
      )
    }
    if (category) {
      result = result.filter((nft) => nft.category === category)
    }
    if (minPrice) {
      result = result.filter((nft) => lowestPrice(nft).gte(minPrice))
    }
    if (maxPrice) {
      result = result.filter((nft) => lowestPrice(nft).lte(maxPrice))
    }

    result = sortNfts(result, sort)

    const total = result.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const items = result.slice((page - 1) * pageSize, page * pageSize)

    const body: Paginated<Nft> = { items, page, pageSize, total, totalPages }
    return HttpResponse.json(body)
  }),

  http.get("/api/nfts/:id", ({ params }) => {
    const nft = getDb().nfts.find((item) => item.id === params.id)
    if (!nft) {
      const error: ApiError = { code: "NOT_FOUND", message: "NFT não encontrado." }
      return HttpResponse.json(error, { status: 404 })
    }
    return HttpResponse.json(nft)
  }),
]
