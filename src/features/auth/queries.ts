import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { login, logout, register, getSession } from "@/api/auth"
import { mergeGuestCart } from "@/api/cart"
import { useStore } from "@/lib/store"
import type { AuthResponse } from "@/types/user"
import { checkoutStore, resetCheckoutDraft, updateDraft } from "../checkout/checkout-store"
import { sessionActions, tokenStore } from "./session-store"

export function sessionQuery() {
  return queryOptions({
    queryKey: ["session"] as const,
    queryFn: ({ signal }) => getSession(signal),
    retry: false,
    staleTime: 60_000,
  })
}

export function useSession() {
  const token = useStore(tokenStore, (value) => value)
  const query = useQuery({ ...sessionQuery(), enabled: token !== null })
  const user = token !== null ? (query.data?.user ?? null) : null
  return { user, token, isLoading: token !== null && query.isPending }
}

export function useOwnerId(): string {
  const { user } = useSession()
  return user?.id ?? "guest"
}

async function completeAuthentication(queryClient: QueryClient, response: AuthResponse): Promise<void> {
  const draft = checkoutStore.get()
  if (draft.ownerId !== null && draft.ownerId !== response.session.user.id) {
    resetCheckoutDraft()
  }

  queryClient.clear()
  sessionActions.signIn(response.token)
  queryClient.setQueryData(sessionQuery().queryKey, response.session)
  updateDraft({ ownerId: response.session.user.id })

  try {
    await mergeGuestCart()
  } catch {
    // se a junção falhar, o carrinho do usuário segue como estava
  }
  await queryClient.invalidateQueries({ queryKey: ["cart"] })
  await queryClient.invalidateQueries({ queryKey: ["quote"] })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (response) => completeAuthentication(queryClient, response),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: register,
    onSuccess: (response) => completeAuthentication(queryClient, response),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      try {
        await logout()
      } catch {
        // mesmo sem resposta do servidor, a sessão local é encerrada
      }
    },
    onSettled: () => {
      sessionActions.signOut()
      resetCheckoutDraft()
      queryClient.clear()
    },
  })
}
