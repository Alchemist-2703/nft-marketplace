import { useMutation } from "@tanstack/react-query"
import { createOrder } from "@/api/orders"
import type { CreateOrderInput } from "@/types/order"

export function useCreateOrder() {
  return useMutation({
    mutationFn: ({ input, key }: { input: CreateOrderInput; key: string }) => createOrder(input, key),
  })
}
