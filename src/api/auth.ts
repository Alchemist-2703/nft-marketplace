import type { AuthResponse, LoginInput, RegisterInput, Session } from "@/types/user"
import { api } from "./client"

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", input)
  return data
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", input)
  return data
}

export async function getSession(signal?: AbortSignal): Promise<Session> {
  const { data } = await api.get<Session>("/auth/session", { signal })
  return data
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout")
}
