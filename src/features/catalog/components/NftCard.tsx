import { Link } from "@tanstack/react-router"
import Decimal from "decimal.js"
import type { Nft } from "@/types/nft"

export function NftCard({ nft }: { nft: Nft }) {
  const soldOut = nft.editions.every((edition) => edition.available === 0)
  const lowest = Decimal.min(...nft.editions.map((edition) => new Decimal(edition.priceEth))).toFixed()

  return (
    <li>
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <div className="relative flex aspect-[258/300] items-center justify-center bg-card">
          <img
            src={nft.images[0]}
            alt={nft.name}
            width={250}
            height={250}
            loading="lazy"
            className="aspect-square w-[97%] rounded-[15px] object-cover"
          />
          {soldOut && (
            <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-1 text-xs font-bold">
              Esgotado
            </span>
          )}
        </div>
        <h2 className="mt-3 text-base">{nft.name}</h2>
        <p className="mt-1 text-lg font-bold text-highlight">{lowest} ETH</p>
      </Link>
    </li>
  )
}