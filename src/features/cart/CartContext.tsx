import { createContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { CartItem, Quote } from "@/types/cart"
import { getStoredCart, saveStoredCart } from "./cartStore"
import axios from "axios"

interface CartContextType {
  items: CartItem[]
  addItem: (nftId: string, editionId: string, quantity: number) => void
  removeItem: (editionId: string) => void
  clearCart: () => void
  quote: Quote | null
  couponCode: string
  setCouponCode: (code: string) => void
  fetchQuote: () => Promise<void>
}

export const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(getStoredCart())
  const [couponCode, setCouponCode] = useState("")
  const [quote, setQuote] = useState<Quote | null>(null)

  const fetchQuote = useCallback(async () => {
    if (items.length === 0) {
      setQuote(null)
      return
    }
    try {
      const res = await axios.post("/api/cart/quote", { items, couponCode })
      setQuote(res.data)
    } catch {
      setQuote(null)
    }
  }, [items, couponCode])

  useEffect(() => {
    saveStoredCart(items)
    fetchQuote()
  }, [items, fetchQuote])

  const addItem = (nftId: string, editionId: string, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.editionId === editionId)
      if (existing) {
        return prev.map((item) =>
          item.editionId === editionId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, { nftId, editionId, quantity }]
    })
  }

  const removeItem = (editionId: string) => {
    setItems((prev) => prev.filter((i) => i.editionId !== editionId))
  }

  const clearCart = () => setItems([])

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, clearCart, quote, couponCode, setCouponCode, fetchQuote }}
    >
      {children}
    </CartContext.Provider>
  )
}