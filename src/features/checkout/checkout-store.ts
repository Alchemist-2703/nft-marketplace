import { createStore } from "@/lib/store"
import type { Network } from "@/types/user"
import type { CreateOrderInput } from "@/types/order"

export interface CheckoutDraft {
  ownerId: string | null
  couponCode: string | null
  walletId: string | null
  network: Network
  name: string | null
  email: string | null
  pendingOrderId: string | null
  attempt: { key: string; signature: string; input: CreateOrderInput } | null}

export const initialDraft: CheckoutDraft = {
  ownerId: null,
  couponCode: null,
  walletId: null,
  network: "ethereum",
  name: null,
  email: null,
  pendingOrderId: null,
  attempt: null,
}

export const checkoutStore = createStore<CheckoutDraft>({
  initial: initialDraft,
  persist: { key: "nft.checkout.draft", storage: "session" },
})

export function updateDraft(partial: Partial<CheckoutDraft>): void {
  checkoutStore.set((previous) => ({ ...previous, ...partial }))
}

export function resetCheckoutDraft(): void {
  checkoutStore.set(initialDraft)
}
