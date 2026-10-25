import { useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { Drawer } from "@/components/Drawer"
import { NativeSelect } from "@/components/NativeSelect"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CatalogFilters } from "@/features/catalog/components/CatalogFilters"
import { NftCard } from "@/features/catalog/components/NftCard"
import { NftGridSkeleton } from "@/features/catalog/components/NftGridSkeleton"
import { Pagination } from "@/features/catalog/components/Pagination"
import { PAGE_SIZE, SORT_OPTIONS } from "@/features/catalog/constants"
import { nftListQuery } from "@/features/catalog/queries"
import { BlogSection } from "@/features/home/components/BlogSection"
import { FeaturedBanner } from "@/features/home/components/FeaturedBanner"
import { Hero } from "@/features/home/components/Hero"
import { PromoCards } from "@/features/home/components/PromoCards"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { NftSort } from "@/types/nft"

export function HomePage() {
  const search = useSearch({ from: "/" })
  const navigate = useNavigate({ from: "/" })
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [filtersOpen, setFiltersOpen] = useState(false)

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
          className={`grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 xl:grid-cols-3 ${isRefreshing ? "opacity-60" : ""}`}
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
    <>
      <Hero />

      <div id="catalogo" className="grid scroll-mt-6 gap-10 lg:grid-cols-[310px_1fr]">
        {isDesktop && (
          <aside aria-label="Filtros" className="space-y-6">
            <div className="bg-card p-5">
              <CatalogFilters key={filtersKey} search={search} />
            </div>
            <FeaturedBanner />
          </aside>
        )}

        <section aria-labelledby="catalog-title" className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-5">
              <h2
                id="catalog-title"
                className="border-b-2 border-highlight pb-1 text-[15px] font-medium text-highlight"
              >
                Todos os NFTs
              </h2>
              {["Novos lançamentos", "Em alta"].map((label) => (
                <span
                  key={label}
                  aria-disabled="true"
                  title="Indisponível nesta versão"
                  className="pb-1 text-[15px] font-medium opacity-50"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isDesktop && (
                <Button
                  type="button"
                  variant="outline"
                  aria-haspopup="dialog"
                  onClick={() => setFiltersOpen(true)}
                >
                  Filtros{hasFilters ? " (ativos)" : ""}
                </Button>
              )}
              <Label htmlFor="sort" className="whitespace-nowrap">
                Ordenar por:
              </Label>
              <NativeSelect
                id="sort"
                className="w-56 max-w-full"
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

        {!isDesktop && (
          <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtros">
            {filtersOpen && (
              <div
                onSubmit={() => setFiltersOpen(false)}
                onChange={(event) => {
                  if (event.target instanceof HTMLSelectElement) {
                    setFiltersOpen(false)
                  }
                }}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("button[type=button]")) {
                    setFiltersOpen(false)
                  }
                }}
              >
                <CatalogFilters key={filtersKey} search={search} />
              </div>
            )}
          </Drawer>
        )}
      </div>

      <PromoCards />
      <BlogSection />
    </>
  )
}