import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/Skeleton"
import { relatedNftsQuery } from "../queries"
import { NftCard } from "./NftCard"

interface RelatedNftsProps {
  category: string
  excludeId: string
}

export function RelatedNfts({ category, excludeId }: RelatedNftsProps) {
  const { data, isPending, isError } = useQuery(relatedNftsQuery(category, excludeId))

  if (isError || (data && data.length === 0)) {
    return null
  }

  return (
    <section aria-labelledby="related-title" className="mt-16">
      <h2 id="related-title" className="mb-6 border-b border-border pb-3 text-sm font-bold">
        Mais desta coleção
      </h2>
      {isPending ? (
        <div role="status" aria-label="Carregando NFTs relacionados">
          <ul className="grid grid-cols-2 gap-6 md:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <li key={index}>
                <Skeleton className="aspect-[258/300] w-full rounded-lg" />
                <Skeleton className="mt-3 h-4 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-6 md:grid-cols-5">
          {data.map((nft) => (
            <NftCard key={nft.id} nft={nft} />
          ))}
        </ul>
      )}
    </section>
  )
}