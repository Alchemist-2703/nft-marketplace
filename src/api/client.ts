import axios, { isAxiosError } from "axios"
import { getGuestId, sessionActions, tokenStore } from "@/features/auth/session-store"
import { getApiError } from "./errors"

export const api = axios.create({
  baseURL: "/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`)
  }
  config.headers.set("X-Guest-Id", getGuestId())
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401 && tokenStore.get()) {
      const code = getApiError(error)?.code
      if (code === "SESSION_EXPIRED" || code === "UNAUTHORIZED") {
        sessionActions.expire()
      }
    }
    return Promise.reject(error)
  },
)
