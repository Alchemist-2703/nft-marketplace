export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

export interface Session {
  user: User
  expiresAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface UpdateProfileInput {
  name: string
  email: string
  avatarUrl?: string | null
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export type WalletKind = "primary" | "secondary"
export type Network = "ethereum" | "polygon" | "arbitrum"

export interface Wallet {
  id: string
  kind: WalletKind
  address: string
  network: Network
  label: string
}

export interface WalletInput {
  kind: WalletKind
  address: string
  network: Network
  label: string
}