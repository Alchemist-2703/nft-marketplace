import type { ChangePasswordInput, UpdateProfileInput, User } from "@/types/user"
import { api } from "./client"

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  const { data } = await api.patch<User>("/profile", input)
  return data
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await api.post("/profile/password", input)
}
