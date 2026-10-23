import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { getQuote } from "@/api/cart"
import { getApiError } from "@/api/errors"
import { Skeleton } from "@/components/Skeleton"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOwnerId } from "@/features/auth/queries"
import { cartKeys, useQuote, useRemoveCartItem, useUpdateCartItem } from "@/features/cart/hooks"
import { checkoutStore, updateDraft } from "@/features/checkout/checkout-store"
import { QuantityStepper } from "@/features/catalog/components/QuantityStepper"
import { useStore } from "@/lib/store"

export function CartPage() {
  const queryClient = useQueryClient()
  const ownerId = useOwnerId()
  const couponCode = useStore(checkoutStore, (draft) => draft.couponCode)
  const network = useStore(checkoutStore, (draft) => draft.network)
  const quote = useQuote(couponCode, network)
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const [code, setCode] = useState("")

  const applyCoupon = useMutation({
    mutationFn: (value: string) => getQuote({ couponCode: value, network }),
    onSuccess: (applied, value) => {
      queryClient.setQueryData(cartKeys.quote(ownerId, applied.couponCode, network), applied)
      updateDraft({ couponCode: value.trim().toUpperCase() })
      setCode("")
    },
  })

  function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (code.trim() !== "") {
      applyCoupon.mutate(code)
    }
  }

  const couponError = getApiError(applyCoupon.error)?.fieldErrors?.couponCode
  const savedCouponError = getApiError(quote.error)?.fieldErrors?.couponCode
  const mutationError = getApiError(updateItem.error ?? removeItem.error)?.message

  if (quote.isError && savedCouponError) {
    return (
      <div role="alert" className="space-y-4 py-8">
        <p>
          O cupom {couponCode} não é mais válido: {savedCouponError}
        </p>
        <Button onClick={() => updateDraft({ couponCode: null })}>Remover cupom</Button>
      </div>
    )
  }

  if (quote.isPending) {
    return (
      <div role="status" aria-label="Carregando carrinho">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-10 lg:grid-cols-[1fr_332px]">
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-[70px] w-full" />
            ))}
          </div>
          <Skeleton className="h-[388px] w-full" />
        </div>
        <span className="sr-only">Carregando carrinho...</span>
      </div>
    )
  }

  if (quote.isError) {
    return (
      <div role="alert" className="space-y-4 py-8">
        <p>Não foi possível carregar o carrinho.</p>
        <Button onClick={() => quote.refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  const data = quote.data
  const hasBlockedLine = data.lines.some((line) => !line.isAvailable)

  if (data.lines.length === 0) {
    return (
      <div className="space-y-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
        <Link to="/" className={buttonVariants()}>
          Explorar NFTs
        </Link>
      </div>
    )
  }

  return (
    <div>
      <nav aria-label="Trilha de navegação" className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">
          Início
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Carrinho</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold">Carrinho de NFTs</h1>

      <div
        className={`grid gap-10 lg:grid-cols-[1fr_332px] ${quote.isPlaceholderData ? "opacity-60" : ""}`}
        aria-busy={quote.isFetching}
      >
        <section aria-label="Itens do carrinho">
          <ul className="divide-y divide-border border-y border-border">
            {data.lines.map((line) => (
              <li key={line.editionId} className="flex flex-wrap items-center gap-4 py-4">
                <img
                  src={line.image}
                  alt={line.name}
                  width={70}
                  height={70}
                  className="h-[70px] w-[70px] rounded-lg object-cover"
                />
                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-bold">{line.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ID do token: {line.tokenId} · {line.editionLabel}
                  </p>
                  {!line.isAvailable && (
                    <p role="alert" className="mt-1 text-xs text-destructive">
                      Indisponível: restam {line.available}. Ajuste a quantidade ou remova o item.
                    </p>
                  )}
                </div>
                <p className="w-24 text-sm">{line.unitPriceEth} ETH</p>
                <QuantityStepper
                  value={line.quantity}
                  max={line.available}
                  onChange={(next) => updateItem.mutate({ editionId: line.editionId, quantity: next })}
                />
                <p className="w-28 text-sm font-bold">{line.lineTotalEth} ETH</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Remover ${line.name} do carrinho`}
                  onClick={() => removeItem.mutate(line.editionId)}
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>
          {mutationError && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {mutationError}
            </p>
          )}
        </section>

        <aside aria-label="Resumo da carteira" className="space-y-6">
          <h2 className="border-b border-border pb-3 text-sm font-bold">Resumo da carteira</h2>

          <form onSubmit={handleApply} className="space-y-2">
            <Label htmlFor="coupon">Código promocional</Label>
            <div className="flex gap-2">
              <Input
                id="coupon"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Digite o código promocional..."
                aria-invalid={couponError ? true : undefined}
                aria-describedby={couponError ? "coupon-error" : undefined}
              />
              <Button type="submit" variant="outline" disabled={applyCoupon.isPending}>
                Aplicar
              </Button>
            </div>
            {couponError && (
              <p id="coupon-error" role="alert" className="text-sm text-destructive">
                {couponError}
              </p>
            )}
            {data.couponCode && (
              <p className="flex items-center justify-between text-sm">
                <span>Cupom {data.couponCode} aplicado</span>
                <button type="button" className="underline" onClick={() => updateDraft({ couponCode: null })}>
                  Remover
                </button>
              </p>
            )}
          </form>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{data.subtotalEth} ETH</dd>
            </div>
            <div className="flex justify-between">
              <dt>Desconto do lançamento</dt>
              <dd>(-) {data.discountEth} ETH</dd>
            </div>
            <div className="flex justify-between">
              <dt>
                Taxa de rede <span className="text-xs text-muted-foreground">(estimada)</span>
              </dt>
              <dd>{data.networkFeeEth} ETH</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd>{data.totalEth} ETH</dd>
            </div>
          </dl>

          {hasBlockedLine ? (
            <Button type="button" className="w-full" disabled>
              Conectar e finalizar
            </Button>
          ) : (
            <Link to="/checkout" className={`${buttonVariants()} w-full`}>
              Conectar e finalizar
            </Link>
          )}
          <Link to="/" className="block text-center text-sm underline">
            Continuar explorando
          </Link>
        </aside>
      </div>
    </div>
  )
}
