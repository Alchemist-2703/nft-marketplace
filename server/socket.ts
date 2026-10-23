
import { createServer } from "node:http"
import { Server } from "socket.io"

import { createNftFixtures } from "../src/mocks/fixtures/nfts"
import type { NftUpdatedEvent } from "../src/types/events"

const PORT = 3001

const httpServer = createServer()

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
})

const nfts = createNftFixtures()
const versions = new Map(nfts.map((nft) => [nft.id, nft.version]))

let eventCounter = 0

io.on("connection", (socket) => {
  console.log(`[Socket.IO] Cliente conectado: ${socket.id}`)

  socket.emit("server:ready", {
    message: "Conectado ao servidor de eventos do marketplace",
  })

  socket.on("disconnect", (reason) => {
    console.log(`[Socket.IO] Cliente desconectado: ${reason}`)
  })
})

function emitNftUpdate() {
  const nft = nfts[Math.floor(Math.random() * nfts.length)]

  if (!nft || nft.editions.length === 0) return

  const edition =
    nft.editions[Math.floor(Math.random() * nft.editions.length)]

  if (!edition) return

  const nextVersion = (versions.get(nft.id) ?? nft.version) + 1
  versions.set(nft.id, nextVersion)

  const currentPrice = Number(edition.priceEth)
  const priceChange = Math.random() < 0.5 ? -0.01 : 0.01
  const nextPrice = Math.max(0.01, currentPrice + priceChange)

  const event: NftUpdatedEvent = {
    eventId: `nft-update-${++eventCounter}`,
    resource: "nft",
    resourceId: nft.id,
    version: nextVersion,
    editionId: edition.id,
    priceEth: nextPrice.toFixed(2),
    available: Math.max(
      0,
      edition.available + (Math.random() < 0.5 ? -1 : 1),
    ),
  }

  // Mantém a referência local coerente para as próximas emissões.
  edition.priceEth = event.priceEth
  edition.available = event.available
  nft.version = nextVersion

  io.emit("nft:updated", event)

  console.log(
    `[Socket.IO] ${event.resourceId} | ${event.editionId} | ` +
      `preço: ${event.priceEth} ETH | estoque: ${event.available} | ` +
      `versão: ${event.version}`,
  )
}

httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Servidor disponível na porta ${PORT}`)
})

// Atualizações demonstrativas a cada 5 segundos.
const updateInterval = setInterval(emitNftUpdate, 5000)

function shutdown() {
  clearInterval(updateInterval)
  io.close(() => {
    httpServer.close(() => {
      process.exit(0)
    })
  })
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
