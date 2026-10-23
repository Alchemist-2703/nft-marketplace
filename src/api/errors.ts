import { isAxiosError } from "axios"
import type { ApiError } from "@/types/common"

export function getApiError(error: unknown): ApiError | null {
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data
    if (typeof data === "object" && data !== null && "code" in data && "message" in data) {
      return data as ApiError
    }
  }
  return null
}

export function getStatus(error: unknown): number | null {
  return isAxiosError(error) && error.response ? error.response.status : null
}

export function isNoResponse(error: unknown): boolean {
  return isAxiosError(error) && !error.response
}
