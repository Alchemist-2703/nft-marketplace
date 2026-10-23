import { api } from "./client"

export async function getFavorites(signal?: AbortSignal): Promise<string[]> {
  const { data } = await api.get<string[]>("/favorites", { signal })
  return data
}

export async function addFavorite(nftId: string): Promise<void> {
  await api.put(`/favorites/${encodeURIComponent(nftId)}`)
}

export async function removeFavorite(nftId: string): Promise<void> {
  await api.delete(`/favorites/${encodeURIComponent(nftId)}`)
}
