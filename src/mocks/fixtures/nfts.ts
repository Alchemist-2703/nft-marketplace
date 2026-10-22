import type { Nft } from "@/types/nft"

const categories = ["Arte", "Música", "Jogos", "Fotografia", "Colecionáveis"]
const creators = ["Aurora Labs", "Pixel Forge", "Nova Studio", "Cripto Atelier", "Blue Orbit"]

function placeholderImage(seed: number, label: string): string {
  const hue = (seed * 47) % 360
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue},70%,45%)"/>` +
    `<stop offset="1" stop-color="hsl(${(hue + 60) % 360},70%,25%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="600" height="600" fill="url(#g)"/>` +
    `<text x="300" y="315" font-size="40" fill="white" text-anchor="middle" font-family="sans-serif">${label}</text>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function createNftFixtures(): Nft[] {
  return Array.from({ length: 36 }, (_, index) => {
    const n = index + 1
    const base = ((n * 37) % 90) + 10
    const name = `NFT #${String(n).padStart(3, "0")}`

    return {
      id: `nft-${n}`,
      name,
      description: `Obra digital exclusiva número ${n}, criada para colecionadores.`,
      creator: creators[n % creators.length],
      category: categories[n % categories.length],
      images: [
        placeholderImage(n, name),
        placeholderImage(n + 100, `${name} - detalhe`),
        placeholderImage(n + 200, `${name} - bastidores`),
      ],
      editions: [
        {
          id: `nft-${n}-common`,
          label: "Edição Comum",
          priceEth: (base / 100).toFixed(2),
          available: (n * 7) % 10 + 1,
        },
        {
          id: `nft-${n}-rare`,
          label: "Edição Rara",
          priceEth: ((base * 2) / 100).toFixed(2),
          available: n % 9 === 0 ? 0 : (n * 3) % 5 + 1,
        },
      ],
      version: 1,
    }
  })
}