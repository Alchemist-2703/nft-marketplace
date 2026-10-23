import type { User, Wallet } from "@/types/user"

export interface UserRecord extends User {
  passwordHash: string
}

export interface WalletRecord extends Wallet {
  userId: string
}

// Senhas de demonstração (nunca em texto puro): SHA-256 de "kurio-demo:<senha>".
// ana@kurio.dev   -> Senha@123
// bruno@kurio.dev -> Senha@456
export function createUserFixtures(): UserRecord[] {
  return [
    {
      id: "user-1",
      name: "Ana Colecionadora",
      email: "ana@kurio.dev",
      avatarUrl: null,
      passwordHash: "df3f94a87a21ae9ed3bd98bf9f37ac1becd7d32bf4ddfe8eb2e78b7004980255",
    },
    {
      id: "user-2",
      name: "Bruno Artista",
      email: "bruno@kurio.dev",
      avatarUrl: null,
      passwordHash: "d788a173375a7c9312f383f31f3fb5d3f5b50752a2c62864392a2f19f198abe0",
    },
  ]
}

export function createWalletFixtures(): WalletRecord[] {
  return [
    {
      id: "wallet-1",
      userId: "user-1",
      kind: "primary",
      label: "Principal",
      address: "0xA91F4b2c8d3e5f607182939a4b5c6d7e8f90E82C",
      network: "ethereum",
      connected: false,
    },
    {
      id: "wallet-2",
      userId: "user-1",
      kind: "secondary",
      label: "Reserva",
      address: "0x7A4219E8c0ffee00112233445566778899aabbcc",
      network: "polygon",
      connected: false,
    },
    {
      id: "wallet-3",
      userId: "user-2",
      kind: "primary",
      label: "Principal",
      address: "0x5B3C1d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c",
      network: "ethereum",
      connected: false,
    },
  ]
}
