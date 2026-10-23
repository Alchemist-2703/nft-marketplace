import { queryOptions } from "@tanstack/react-query"
import { getNft, listNfts } from "@/api/nfts"
import type { NftListParams } from "@/types/nft"

export const nftKeys = {
  all: ["nfts"] as const,
  list: (params: NftListParams) => [...nftKeys.all, "list", params] as const,
  detail: (id: string) => [...nftKeys.all, "detail", id] as const,
  related: (category: string, excludeId: string) =>
    [...nftKeys.all, "related", category, excludeId] as const,
}

export function nftListQuery(params: NftListParams) {
  return queryOptions({
    queryKey: nftKeys.list(params),
    queryFn: ({ signal }) => listNfts(params, signal),
  })
}

export function nftDetailQuery(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => getNft(id, signal),
  })
}

export function relatedNftsQuery(category: string, excludeId: string) {
  return queryOptions({
    queryKey: nftKeys.related(category, excludeId),
    queryFn: async ({ signal }) => {
      const result = await listNfts({ category, pageSize: 6 }, signal)
      return result.items.filter((item) => item.id !== excludeId).slice(0, 5)
    },
  })
}