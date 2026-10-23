import type { FormEvent } from "react"
import { useNavigate } from "@tanstack/react-router"
import { NativeSelect } from "@/components/NativeSelect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CATEGORIES } from "../constants"
import type { HomeSearch } from "../search"

function clean(value: FormDataEntryValue | null): string | undefined {
  const text = typeof value === "string" ? value.trim() : ""
  return text === "" ? undefined : text
}

export function CatalogFilters({ search }: { search: HomeSearch }) {
  const navigate = useNavigate({ from: "/" })

  function apply(next: Partial<HomeSearch>) {
    navigate({ search: (prev) => ({ ...prev, ...next, page: undefined }) })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    apply({
      q: clean(data.get("q")),
      minPrice: clean(data.get("minPrice")),
      maxPrice: clean(data.get("maxPrice")),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Filtros do catálogo">
      <div className="space-y-2">
        <Label htmlFor="filter-q">Buscar</Label>
        <Input
          id="filter-q"
          name="q"
          type="search"
          placeholder="Nome ou criador"
          defaultValue={search.q ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-category">Categoria</Label>
        <NativeSelect
          id="filter-category"
          value={search.category ?? ""}
          onChange={(event) => apply({ category: event.target.value || undefined })}
        >
          <option value="">Todas</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </NativeSelect>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Preço (ETH)</legend>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="filter-min">Mínimo</Label>
            <Input
              id="filter-min"
              name="minPrice"
              inputMode="decimal"
              pattern="\d+(\.\d+)?"
              title="Use números, por exemplo 0.5"
              placeholder="0.00"
              defaultValue={search.minPrice ?? ""}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="filter-max">Máximo</Label>
            <Input
              id="filter-max"
              name="maxPrice"
              inputMode="decimal"
              pattern="\d+(\.\d+)?"
              title="Use números, por exemplo 2.5"
              placeholder="10.00"
              defaultValue={search.maxPrice ?? ""}
            />
          </div>
        </div>
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1">
          Aplicar filtros
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate({ search: {} })}>
          Limpar
        </Button>
      </div>
    </form>
  )
}