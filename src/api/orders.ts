import type { CreateOrderInput, Order } from "@/types/order"
import { api } from "./client"

export async function createOrder(input: CreateOrderInput, idempotencyKey: string): Promise<Order> {
  const { data } = await api.post<Order>("/orders", input, {
    headers: { "Idempotency-Key": idempotencyKey },
  })
  return data
}

export async function getOrder(id: string, signal?: AbortSignal): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal })
  return data
}
