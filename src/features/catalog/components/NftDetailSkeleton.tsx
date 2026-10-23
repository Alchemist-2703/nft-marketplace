import { Skeleton } from "@/components/Skeleton"

export function NftDetailSkeleton() {
  return (
    <div role="status" aria-label="Carregando NFT">
      <Skeleton className="mb-6 h-4 w-40" />
      <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
        <div className="flex flex-col-reverse gap-4 md:flex-row">
          <div className="flex gap-3 md:flex-col">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-16 rounded-lg md:h-[100px] md:w-[100px]" />
            ))}
          </div>
          <Skeleton className="aspect-square w-full rounded-lg md:flex-1" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      </div>
      <span className="sr-only">Carregando NFT...</span>
    </div>
  )
}