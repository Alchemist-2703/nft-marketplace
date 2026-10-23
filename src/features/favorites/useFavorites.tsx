import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

export function useFavorites(userId?: string) {
  const queryClient = useQueryClient()
  const queryKey = ["favorites", userId]

  const { data: favorites = [] } = useQuery<string[]>({
    queryKey,
    queryFn: async () => {
      if (!userId) return []
      const res = await axios.get(`/api/users/${userId}/favorites`)
      return res.data
    },
    enabled: Boolean(userId),
  })

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (nftId: string) => {
      const res = await axios.post(`/api/users/${userId}/favorites/toggle`, { nftId })
      return res.data as string[]
    },
    onMutate: async (nftId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<string[]>(queryKey) ?? []
      const exists = previous.includes(nftId)
      const next = exists ? previous.filter((id) => id !== nftId) : [...previous, nftId]
      queryClient.setQueryData(queryKey, next)
      return { previous }
    },
    onError: (_err, _nftId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    favorites,
    isFavorite: (nftId: string) => favorites.includes(nftId),
    toggleFavorite: (nftId: string) => toggleFavoriteMutation.mutate(nftId),
  }
}