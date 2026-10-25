import type { Nft } from "@/types/nft"

const categories = ["Arte", "Música", "Jogos", "Fotografia", "Colecionáveis"]
const creators = ["Aurora Labs", "Pixel Forge", "Nova Studio", "Cripto Atelier", "Blue Orbit"]
const attributePool = ["Óculos", "Esmeralda", "Raro", "Dourado", "Neon", "Clássico"]

const ARTWORKS = ["/art/nft-1.png", "/art/nft-2.png", "/art/nft-3.png", "/art/nft-4.png"]

export function createNftFixtures(): Nft[] {
  return Array.from({ length: 36 }, (_, index) => {
    const n = index + 1
    const base = ((n * 37) % 90) + 10
    const name = `NFT #${String(n).padStart(3, "0")}`
    const creator = creators[n % creators.length]

    return {
      id: `nft-${n}`,
      tokenId: `#${String(n).padStart(4, "0")}`,
      name,
      description: `Obra digital exclusiva número ${n}, criada para colecionadores.`,
      creator,
      collection: `${creator} Collection`,
      category: categories[n % categories.length],
      attributes: [attributePool[n % attributePool.length], attributePool[(n + 2) % attributePool.length]],
      images: [0, 1, 2, 3].map((offset) => ARTWORKS[(n + offset) % ARTWORKS.length]),
      editions: [
        {
          id: `nft-${n}-common`,
          label: "Edição Comum",
          priceEth: (base / 100).toFixed(2),
          available: ((n * 7) % 10) + 1,
        },
        {
          id: `nft-${n}-rare`,
          label: "Edição Rara",
          priceEth: ((base * 2) / 100).toFixed(2),
          available: n % 9 === 0 ? 0 : ((n * 3) % 5) + 1,
        },
      ],
      version: 1,
    }
  })
}