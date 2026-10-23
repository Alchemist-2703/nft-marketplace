import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { addCartItem, getCart, getQuote, removeCartItem, updateCartItem } from "@/api/cart"
import type { Network } from "@/types/user"
import { useOwnerId } from "../auth/queries"

export const cartKeys = {
  cart: (ownerId: string) => ["cart", ownerId] as const,
  quote: (ownerId: string, couponCode: string | null, network: Network) =>
    ["quote", ownerId, couponCode, network] as const,
}

export function quoteQuery(ownerId: string, couponCode: string | null, network: Network) {
  return queryOptions({
    queryKey: cartKeys.quote(ownerId, couponCode, network),
    queryFn: ({ signal }) => getQuote({ couponCode, network }, signal),
  })
}

export function useCart() {
  const ownerId = useOwnerId()
  return useQuery({
    queryKey: cartKeys.cart(ownerId),
    queryFn: ({ signal }) => getCart(signal),
  })
}

export function useCartCount(): number {
  const { data } = useCart()
  return data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0
}

export function useQuote(couponCode: string | null, network: Network) {
  const ownerId = useOwnerId()
  return useQuery({
    ...quoteQuery(ownerId, couponCode, network),
    placeholderData: keepPreviousData,
  })
}

function useRefreshCart() {
  const queryClient = useQueryClient()
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["cart"] }),
      queryClient.invalidateQueries({ queryKey: ["quote"] }),
    ])
  }
}

export function useAddToCart() {
  const refresh = useRefreshCart()
  return useMutation({ mutationFn: addCartItem, onSuccess: refresh })
}

export function useUpdateCartItem() {
  const refresh = useRefreshCart()
  return useMutation({
    mutationFn: ({ editionId, quantity }: { editionId: string; quantity: number }) =>
      updateCartItem(editionId, quantity),
    onSuccess: refresh,
  })
}

export function useRemoveCartItem() {
  const refresh = useRefreshCart()
  return useMutation({ mutationFn: removeCartItem, onSuccess: refresh })
}
