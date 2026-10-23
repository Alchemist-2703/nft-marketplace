import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { NativeSelect } from "@/components/NativeSelect"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CatalogFilters } from "@/features/catalog/components/CatalogFilters"
import { NftCard } from "@/features/catalog/components/NftCard"
import { NftGridSkeleton } from "@/features/catalog/components/NftGridSkeleton"
import { Pagination } from "@/features/catalog/components/Pagination"
import { PAGE_SIZE, SORT_OPTIONS } from "@/features/catalog/constants"
import { nftListQuery } from "@/features/catalog/queries"
import type { NftSort } from "@/types/nft"

export function HomePage() {
  const search = useSearch({ from: "/" })
  const navigate = useNavigate({ from: "/" })

  const { data, isPending, isError, isFetching, refetch } = useQuery({
    ...nftListQuery({ ...search, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  })

  const filtersKey = JSON.stringify([search.q, search.category, search.minPrice, search.maxPrice])
  const hasFilters = Boolean(search.q || search.category || search.minPrice || search.maxPrice)
  const isRefreshing = isFetching && !isPending

  let content
  if (isPending) {
    content = <NftGridSkeleton count={PAGE_SIZE} />
  } else if (isError) {
    content = (
      <div role="alert" className="rounded-lg border border-border p-8 text-center">
        <p className="mb-4">Não foi possível carregar os NFTs. Verifique sua conexão e tente de novo.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    )
  } else if (data.items.length === 0) {
    content = (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="mb-4">Nenhum NFT encontrado para esses filtros.</p>
        {hasFilters && (
          <Button variant="outline" onClick={() => navigate({ search: {} })}>
            Limpar filtros
          </Button>
        )}
      </div>
    )
  } else {
    content = (
      <>
        <ul
          aria-busy={isRefreshing}
          className={`grid gap-6 sm:grid-cols-2 xl:grid-cols-3 ${isRefreshing ? "opacity-60" : ""}`}
        >
          {data.items.map((nft) => (
            <NftCard key={nft.id} nft={nft} />
          ))}
        </ul>
        <Pagination page={data.page} totalPages={data.totalPages} />
      </>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[310px_1fr]">
      <aside>
        <CatalogFilters key={filtersKey} search={search} />
      </aside>

      <section aria-labelledby="catalog-title">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 id="catalog-title" className="text-lg font-bold">
            Todos os NFTs
          </h1>
          <div className="flex items-center gap-3">
            <Label htmlFor="sort" className="whitespace-nowrap">
              Ordenar por:
            </Label>
            <NativeSelect
              id="sort"
              className="w-56"
              value={search.sort ?? "newest"}
              onChange={(event) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    sort: event.target.value as NftSort,
                    page: undefined,
                  }),
                })
              }
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <p role="status" className="sr-only">
          {data ? `${data.total} NFTs encontrados` : ""}
        </p>
        {data && !isError && (
          <p className="mb-4 text-sm text-muted-foreground">
            {data.total} NFTs {isRefreshing ? "· atualizando..." : ""}
          </p>
        )}

        {content}
      </section>
    </div>
  )
}