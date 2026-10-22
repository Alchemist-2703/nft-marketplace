import type { Nft } from "@/types/nft"
import { createNftFixtures } from "./fixtures/nfts"

interface Db {
  nfts: Nft[]
}

function createInitialDb(): Db {
  return { nfts: createNftFixtures() }
}

let db: Db = createInitialDb()

export function getDb(): Db {
  return db
}

export function resetDb(): void {
  db = createInitialDb()
}