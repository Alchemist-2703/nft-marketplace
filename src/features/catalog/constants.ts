import type { NftSort } from "@/types/nft"

export const PAGE_SIZE = 12

export const CATEGORIES = ["Arte", "Música", "Jogos", "Fotografia", "Colecionáveis"]

export const SORT_OPTIONS: { value: NftSort; label: string }[] = [
  { value: "newest", label: "Listados recentemente" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "name_asc", label: "Nome (A-Z)" },
]