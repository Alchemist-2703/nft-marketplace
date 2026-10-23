
import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { socket } from "./socket"
import { nftKeys } from "@/features/catalog/queries"
import type { Nft, NftEdition } from "@/types/nft"
import type { NftUpdatedEvent } from "@/types/events"

function isNft(value: unknown): value is Nft {
  if (typeof value !== "object" || value === null) return false

  const candidate = value as Partial<Nft>

  return (
    typeof candidate.id === "string" &&
    typeof candidate.version === "number" &&
    Array.isArray(candidate.editions)
  )
}

function updateNft(nft: Nft, event: NftUpdatedEvent): Nft {
  if (nft.id !== event.resourceId) return nft

  if (event.version <= nft.version) {
    console.warn("[Socket.IO] Versão antiga ou repetida:", {
      nftVersion: nft.version,
      eventVersion: event.version,
    })
    return nft
  }

  let editionFound = false

  const editions = nft.editions.map((edition): NftEdition => {
    if (edition.id !== event.editionId) return edition

    editionFound = true

    return {
      ...edition,
      priceEth: event.priceEth as NftEdition["priceEth"],
      available: event.available,
    }
  })

  if (!editionFound) {
    console.warn("[Socket.IO] Edição não encontrada:", event.editionId)
    return nft
  }

  console.info("[Socket.IO] Aplicando atualização:", {
    nftId: nft.id,
    editionId: event.editionId,
    version: event.version,
    priceEth: event.priceEth,
    available: event.available,
  })

  return { ...nft, editions, version: event.version }
}

function updateCachedData(data: unknown, event: NftUpdatedEvent): unknown {
  if (Array.isArray(data)) {
    return data.map((item) =>
      isNft(item) ? updateNft(item, event) : item,
    )
  }

  if (!data || typeof data !== "object") return data

  if (isNft(data)) return updateNft(data, event)

  const paginated = data as { items?: unknown }

  if (Array.isArray(paginated.items)) {
    return {
      ...paginated,
      items: paginated.items.map((item) =>
        isNft(item) ? updateNft(item, event) : item,
      ),
    }
  }

  return data
}

export function SocketEventsBridge() {
  const queryClient = useQueryClient()

  useEffect(() => {
    function handleNftUpdated(event: NftUpdatedEvent) {
      console.log("[Socket.IO] Evento NFT recebido:", event)

      if (
        !event ||
        event.resource !== "nft" ||
        typeof event.eventId !== "string" ||
        !event.eventId ||
        typeof event.resourceId !== "string" ||
        !event.resourceId ||
        typeof event.editionId !== "string" ||
        !event.editionId ||
        !Number.isInteger(event.version) ||
        event.version < 1 ||
        !Number.isInteger(event.available) ||
        event.available < 0 ||
        typeof event.priceEth !== "string" ||
        !Number.isFinite(Number(event.priceEth)) ||
        Number(event.priceEth) <= 0
      ) {
        console.warn("[Socket.IO] Evento inválido:", event)
        return
      }

      const detailKey = nftKeys.detail(event.resourceId)

      const nftQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: nftKeys.all })

      console.log("[Socket.IO] Consultas de NFT no cache:", 
        nftQueries.map((query) => ({
          queryKey: query.queryKey,
          status: query.state.status,
          data: query.state.data,
        })),
      )

      const previousNft = queryClient.getQueryData<Nft>(detailKey)

      console.log("[Socket.IO] Consulta individual:", {
        expectedKey: detailKey,
        found: previousNft !== undefined,
        cachedVersion: previousNft?.version,
        nftId: previousNft?.id,
      })

      queryClient.setQueriesData(
        { queryKey: nftKeys.all },
        (oldData: unknown) => updateCachedData(oldData, event),
      )

      const updatedNft = queryClient.getQueryData<Nft>(detailKey)

      console.log("[Socket.IO] Resultado final:", {
        nftId: event.resourceId,
        version: updatedNft?.version,
        edition: updatedNft?.editions.find(
          (item) => item.id === event.editionId,
        ),
      })
    }

    function handleConnect() {
      console.info("[Socket.IO] Conectado")
    }

    function handleDisconnect(reason: string) {
      console.info("[Socket.IO] Desconectado:", reason)
    }

    socket.on("nft:updated", handleNftUpdated)
    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)

    socket.connect()

    return () => {
      socket.off("nft:updated", handleNftUpdated)
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.disconnect()
    }
  }, [queryClient])

  return null
}
