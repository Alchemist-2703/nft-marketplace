import { useState } from "react"
import { Link, useLocation, useRouter } from "@tanstack/react-router"
import Decimal from "decimal.js"
import { getApiError } from "@/api/errors"
import { Button } from "@/components/ui/button"
import { useSession } from "@/features/auth/queries"
import { useAddToCart } from "@/features/cart/hooks"
import { useFavorites, useToggleFavorite } from "@/features/favorites/hooks"
import type { Nft } from "@/types/nft"
import { EditionSelector } from "./EditionSelector"
import { NftGallery } from "./NftGallery"
import { QuantityStepper } from "./QuantityStepper"
import { RelatedNfts } from "./RelatedNfts"

export function NftDetail({ nft }: { nft: Nft }) {
  const router = useRouter()
  const location = useLocation()
  const { user } = useSession()
  const favorites = useFavorites()
  const toggleFavorite = useToggleFavorite(nft.id)
  const addToCart = useAddToCart()

  const firstAvailable = nft.editions.find((edition) => edition.available > 0)
  const [editionId, setEditionId] = useState(firstAvailable?.id ?? nft.editions[0].id)
  const [requestedQuantity, setRequestedQuantity] = useState(1)

  const edition = nft.editions.find((item) => item.id === editionId) ?? nft.editions[0]
  const soldOut = firstAvailable === undefined
  const quantity = Math.min(requestedQuantity, Math.max(edition.available, 1))
  const total = new Decimal(edition.priceEth).times(quantity).toFixed()
  const isFavorite = favorites.data?.includes(nft.id) ?? false

  function handleEditionChange(id: string) {
    setEditionId(id)
    setRequestedQuantity(1)
  }

  function handleFavorite() {
    if (!user) {
      router.history.push(`/login?redirect=${encodeURIComponent(location.href)}`)
      return
    }
    toggleFavorite.mutate(!isFavorite)
  }

  async function handleBuy() {
    try {
      await addToCart.mutateAsync({ nftId: nft.id, editionId: edition.id, quantity })
      router.history.push("/cart")
    } catch {
      // a mensagem de erro é exibida abaixo, a partir de addToCart.error
    }
  }

  return (
    <div>
      <nav aria-label="Trilha de navegação" className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline focus-visible:outline-2 focus-visible:outline-ring">
          Início
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{nft.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <NftGallery images={nft.images} name={nft.name} />

        <div className="space-y-6">
          <div className="border-b border-border pb-4">
            <h1 className="text-3xl font-bold">{nft.name}</h1>
            <p className="mt-3 text-lg text-highlight">{edition.priceEth} ETH</p>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium">Sobre este NFT:</h2>
            <p className="text-sm leading-6 text-muted-foreground">{nft.description}</p>
          </div>

          <EditionSelector
            editions={nft.editions}
            selectedId={edition.id}
            onChange={handleEditionChange}
          />

          {soldOut ? (
            <p role="alert" className="rounded-md border border-border p-4 text-sm">
              Todas as edições deste NFT estão esgotadas.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-6">
                <QuantityStepper
                  value={quantity}
                  max={edition.available}
                  onChange={setRequestedQuantity}
                />
                <p className="text-sm">
                  Total: <strong>{total} ETH</strong>
                </p>
              </div>
              {quantity >= edition.available && (
                <p className="text-sm text-muted-foreground">
                  Limite de {edition.available} {edition.available === 1 ? "unidade" : "unidades"} para esta
                  edição.
                </p>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={soldOut || addToCart.isPending} onClick={handleBuy}>
              {addToCart.isPending ? "ADICIONANDO…" : "COMPRAR"}
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-pressed={isFavorite}
              disabled={toggleFavorite.isPending}
              onClick={handleFavorite}
            >
              {isFavorite ? "♥ Favoritado" : "♡ Favoritar"}
            </Button>
          </div>

          <div aria-live="polite">
            {addToCart.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getApiError(addToCart.error)?.message ?? "Não foi possível adicionar ao carrinho."}
              </p>
            )}
            {toggleFavorite.isError && (
              <p role="alert" className="text-sm text-destructive">
                Não foi possível atualizar seus favoritos. A alteração foi desfeita.
              </p>
            )}
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">ID do token:</dt>
              <dd>{nft.tokenId}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Coleção:</dt>
              <dd>{nft.collection}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Atributos:</dt>
              <dd>{nft.attributes.join(", ")}</dd>
            </div>
          </dl>
        </div>
      </div>

      <RelatedNfts category={nft.category} excludeId={nft.id} />
    </div>
  )
}
