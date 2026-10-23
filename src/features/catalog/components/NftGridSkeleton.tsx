import { Skeleton } from "@/components/Skeleton"

export function NftGridSkeleton({ count }: { count: number }) {
  return (
    <div role="status" aria-label="Carregando NFTs">
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <Skeleton className="aspect-[258/300] w-full rounded-lg" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </li>
        ))}
      </ul>
      <span className="sr-only">Carregando NFTs...</span>
    </div>
  )
}