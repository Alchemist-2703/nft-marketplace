import type { Paginated } from "@/types/common"
import type { Nft, NftListParams } from "@/types/nft"
import { api } from "./client"

export async function listNfts(
  params: NftListParams,
  signal?: AbortSignal,
): Promise<Paginated<Nft>> {
  const { data } = await api.get<Paginated<Nft>>("/nfts", { params, signal })
  return data
}

export async function getNft(id: string, signal?: AbortSignal): Promise<Nft> {
  const { data } = await api.get<Nft>(`/nfts/${encodeURIComponent(id)}`, { signal })
  return data
}