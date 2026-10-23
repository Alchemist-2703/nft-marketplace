import { Link } from "@tanstack/react-router"
import type { Nft } from "@/types/nft"

export function NftCard({ nft }: { nft: Nft }) {
  const soldOut = nft.editions.every((edition) => edition.available === 0)

  return (
    <li>
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <div className="relative aspect-[258/300] overflow-hidden rounded-lg bg-card">
          <img
            src={nft.images[0]}
            alt={nft.name}
            width={258}
            height={300}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {soldOut && (
            <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-1 text-xs font-bold">
              Esgotado
            </span>
          )}
        </div>
        <h2 className="mt-3 text-sm font-bold">{nft.name}</h2>
        <p className="mt-1 flex gap-3 text-sm text-muted-foreground">
          {nft.editions.map((edition) => (
            <span key={edition.id}>{edition.priceEth} ETH</span>
          ))}
        </p>
      </Link>
    </li>
  )
}