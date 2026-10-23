import type { Network } from "@/types/user"

export const NETWORKS: { value: Network; label: string }[] = [
  { value: "ethereum", label: "Ethereum Mainnet" },
  { value: "polygon", label: "Polygon" },
  { value: "arbitrum", label: "Arbitrum" },
]

export function networkLabel(network: Network): string {
  return NETWORKS.find((item) => item.value === network)?.label ?? network
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
