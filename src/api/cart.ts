import type { AddCartItemInput, Cart, Quote, QuoteRequest } from "@/types/cart"
import { api } from "./client"

export async function getCart(signal?: AbortSignal): Promise<Cart> {
  const { data } = await api.get<Cart>("/cart", { signal })
  return data
}

export async function addCartItem(input: AddCartItemInput): Promise<Cart> {
  const { data } = await api.post<Cart>("/cart/items", input)
  return data
}

export async function updateCartItem(editionId: string, quantity: number): Promise<Cart> {
  const { data } = await api.patch<Cart>(`/cart/items/${encodeURIComponent(editionId)}`, { quantity })
  return data
}

export async function removeCartItem(editionId: string): Promise<Cart> {
  const { data } = await api.delete<Cart>(`/cart/items/${encodeURIComponent(editionId)}`)
  return data
}

export async function mergeGuestCart(): Promise<Cart> {
  const { data } = await api.post<Cart>("/cart/merge")
  return data
}

export async function getQuote(request: QuoteRequest, signal?: AbortSignal): Promise<Quote> {
  const { data } = await api.post<Quote>("/quote", request, { signal })
  return data
}
