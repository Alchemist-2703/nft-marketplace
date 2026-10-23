import { useMutation, useQueryClient } from "@tanstack/react-query"
import { changePassword, updateProfile } from "@/api/profile"
import type { Session } from "@/types/user"
import { sessionQuery } from "../auth/queries"

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData<Session>(sessionQuery().queryKey, (current) =>
        current ? { ...current, user } : current,
      )
    },
  })
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}
