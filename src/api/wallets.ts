import type { Wallet, WalletInput } from "@/types/user"
import { api } from "./client"

export async function listWallets(signal?: AbortSignal): Promise<Wallet[]> {
  const { data } = await api.get<Wallet[]>("/wallets", { signal })
  return data
}

export async function createWallet(input: WalletInput): Promise<Wallet> {
  const { data } = await api.post<Wallet>("/wallets", input)
  return data
}

export async function updateWallet(id: string, input: WalletInput): Promise<Wallet> {
  const { data } = await api.patch<Wallet>(`/wallets/${encodeURIComponent(id)}`, input)
  return data
}

export async function connectWallet(id: string): Promise<Wallet> {
  const { data } = await api.post<Wallet>(`/wallets/${encodeURIComponent(id)}/connect`)
  return data
}

export async function disconnectWallet(id: string): Promise<Wallet> {
  const { data } = await api.delete<Wallet>(`/wallets/${encodeURIComponent(id)}/connection`)
  return data
}
