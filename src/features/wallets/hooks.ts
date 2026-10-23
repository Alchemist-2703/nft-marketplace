import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  connectWallet,
  createWallet,
  disconnectWallet,
  listWallets,
  updateWallet,
} from "@/api/wallets"
import type { WalletInput } from "@/types/user"
import { useSession } from "../auth/queries"

export const walletKeys = {
  list: (ownerId: string) => ["wallets", ownerId] as const,
}

export function useWallets() {
  const { user } = useSession()
  return useQuery({
    queryKey: walletKeys.list(user?.id ?? "guest"),
    queryFn: ({ signal }) => listWallets(signal),
    enabled: user !== null,
  })
}

export function useWalletConnection() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const refresh = () => queryClient.invalidateQueries({ queryKey: walletKeys.list(user?.id ?? "guest") })

  const connect = useMutation({ mutationFn: connectWallet, onSuccess: refresh })
  const disconnect = useMutation({ mutationFn: disconnectWallet, onSuccess: refresh })
  return { connect, disconnect }
}

export function useSaveWallet(walletId: string | null) {
  const queryClient = useQueryClient()
  const { user } = useSession()

  return useMutation({
    mutationFn: (input: WalletInput) =>
      walletId ? updateWallet(walletId, input) : createWallet(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.list(user?.id ?? "guest") }),
  })
}
