import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { addFavorite, getFavorites, removeFavorite } from "@/api/favorites"
import { useSession } from "../auth/queries"

export const favoriteKeys = {
  list: (ownerId: string) => ["favorites", ownerId] as const,
}

export function useFavorites() {
  const { user } = useSession()
  return useQuery({
    queryKey: favoriteKeys.list(user?.id ?? "guest"),
    queryFn: ({ signal }) => getFavorites(signal),
    enabled: user !== null,
  })
}

export function useToggleFavorite(nftId: string) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const key = favoriteKeys.list(user?.id ?? "guest")

  return useMutation({
    mutationFn: async (shouldFavorite: boolean) => {
      if (shouldFavorite) {
        await addFavorite(nftId)
      } else {
        await removeFavorite(nftId)
      }
    },
    onMutate: async (shouldFavorite) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<string[]>(key)
      queryClient.setQueryData<string[]>(key, (current = []) =>
        shouldFavorite ? [...new Set([...current, nftId])] : current.filter((id) => id !== nftId),
      )
      return { previous }
    },
    onError: (_error, _shouldFavorite, context) => {
      queryClient.setQueryData(key, context?.previous ?? [])
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
