import type { QueryClient } from "@tanstack/react-query"
import type { Paginated } from "@/types/common"
import type { NftUpdatedEvent, OrderUpdatedEvent } from "@/types/events"
import type { Quote } from "@/types/cart"
import type { Nft } from "@/types/nft"
import type { Order } from "@/types/order"
import { updateDraft, checkoutStore } from "../checkout/checkout-store"
import { pushNotice } from "./notices-store"

function isNft(value: unknown): value is Nft {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "editions" in value &&
    Array.isArray((value as Nft).editions)
  )
}

function isPaginatedNfts(value: unknown): value is Paginated<Nft> {
  return typeof value === "object" && value !== null && Array.isArray((value as Paginated<Nft>).items)
}

function patchNft(nft: Nft, event: NftUpdatedEvent): Nft {
  if (nft.id !== event.resourceId || event.version <= nft.version) {
    return nft
  }
  return {
    ...nft,
    version: event.version,
    editions: nft.editions.map((edition) =>
      edition.id === event.editionId
        ? { ...edition, priceEth: event.priceEth, available: event.available }
        : edition,
    ),
  }
}

function patchCached(data: unknown, event: NftUpdatedEvent): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => (isNft(item) ? patchNft(item, event) : item))
  }
  if (isPaginatedNfts(data)) {
    return { ...data, items: data.items.map((item) => patchNft(item, event)) }
  }
  if (isNft(data)) {
    return patchNft(data, event)
  }
  return data
}

function findKnownNft(queryClient: QueryClient, nftId: string): Nft | undefined {
  const detail = queryClient.getQueryData<Nft>(["nfts", "detail", nftId])
  if (detail) {
    return detail
  }
  for (const [, data] of queryClient.getQueriesData<unknown>({ queryKey: ["nfts"] })) {
    const candidates: unknown[] = Array.isArray(data)
      ? data
      : isPaginatedNfts(data)
        ? data.items
        : [data]
    const found = candidates.find((item): item is Nft => isNft(item) && item.id === nftId)
    if (found) {
      return found
    }
  }
  return undefined
}

export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent): void {
  const before = findKnownNft(queryClient, event.resourceId)
  const isNewerThanKnown = before === undefined || event.version > before.version
  const previousEdition = before?.editions.find((edition) => edition.id === event.editionId)

  const quoteLine = queryClient
    .getQueriesData<Quote>({ queryKey: ["quote"] })
    .flatMap(([, quote]) => quote?.lines ?? [])
    .find((line) => line.editionId === event.editionId)

  queryClient.setQueriesData({ queryKey: ["nfts"] }, (data: unknown) => patchCached(data, event))

  if (before && isNewerThanKnown && event.version > before.version + 1) {
    void queryClient.invalidateQueries({ queryKey: ["nfts"] })
  }
  void queryClient.invalidateQueries({ queryKey: ["quote"] })
  void queryClient.invalidateQueries({ queryKey: ["cart"] })

  const name = before?.name ?? quoteLine?.name
  const label = previousEdition?.label ?? quoteLine?.editionLabel
  const oldPrice = previousEdition?.priceEth ?? quoteLine?.unitPriceEth
  const oldAvailable = previousEdition?.available ?? quoteLine?.available
  const relevant = isNewerThanKnown && (quoteLine !== undefined || before !== undefined)

  if (!relevant || !name) {
    return
  }
  const where = label ? `${name} (${label})` : name
  if (oldPrice !== undefined && oldPrice !== event.priceEth) {
    pushNotice(`O preço de ${where} mudou de ${oldPrice} para ${event.priceEth} ETH.`, "warning")
  }
  if (oldAvailable !== undefined && oldAvailable !== event.available) {
    pushNotice(
      event.available === 0
        ? `${where} esgotou.`
        : `A disponibilidade de ${where} mudou: restam ${event.available}.`,
      "warning",
    )
  }
}

export function applyOrderUpdated(
  queryClient: QueryClient,
  ownerId: string,
  event: OrderUpdatedEvent,
): void {
  const key = ["order", ownerId, event.resourceId] as const
  const cached = queryClient.getQueryData<Order>(key)
  if (cached && cached.version >= event.version) {
    return
  }
  queryClient.setQueryData(key, event.order)

  if (event.order.status === "pending") {
    return
  }

  void queryClient.invalidateQueries({ queryKey: ["cart"] })
  void queryClient.invalidateQueries({ queryKey: ["quote"] })
  void queryClient.invalidateQueries({ queryKey: ["nfts"] })

  if (checkoutStore.get().pendingOrderId === event.resourceId) {
    updateDraft({ pendingOrderId: null, attempt: null })
  }
  pushNotice(
    event.order.status === "confirmed"
      ? `Pedido ${event.order.id} confirmado.`
      : `Pedido ${event.order.id} recusado: ${event.order.declineReason ?? "sem motivo informado"}`,
    event.order.status === "confirmed" ? "info" : "warning",
  )
}

export function reconcileAll(queryClient: QueryClient): void {
  for (const key of ["nfts", "quote", "cart", "order", "favorites", "wallets"]) {
    void queryClient.invalidateQueries({ queryKey: [key] })
  }
}
