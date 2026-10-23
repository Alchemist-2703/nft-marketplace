import { useEffect, useRef, useState, type FormEvent } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useRouter } from "@tanstack/react-router"
import { getApiError, isNoResponse } from "@/api/errors"
import { FormField } from "@/components/FormField"
import { NativeSelect } from "@/components/NativeSelect"
import { Skeleton } from "@/components/Skeleton"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useOwnerId, useSession } from "@/features/auth/queries"
import { validateEmail, type FieldErrors } from "@/features/auth/validation"
import { quoteQuery, useQuote } from "@/features/cart/hooks"
import { checkoutStore, updateDraft } from "@/features/checkout/checkout-store"
import { NETWORKS, networkLabel, shortAddress } from "@/features/checkout/constants"
import { useCreateOrder } from "@/features/checkout/hooks"
import { useWalletConnection, useWallets } from "@/features/wallets/hooks"
import { useStore } from "@/lib/store"
import type { CreateOrderInput } from "@/types/order"
import type { Network } from "@/types/user"

interface Notice {
  tone: "info" | "error"
  text: string
}

export function CheckoutPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const ownerId = useOwnerId()
  const { user } = useSession()
  const draft = useStore(checkoutStore, (state) => state)
  const wallets = useWallets()
  const { connect, disconnect } = useWalletConnection()
  const quote = useQuote(draft.couponCode, draft.network)
  const createOrder = useCreateOrder()

  const [step, setStep] = useState<"form" | "review">("form")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [reviewedQuoteId, setReviewedQuoteId] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitting = useRef(false)

  const pendingOrderId = draft.pendingOrderId
  useEffect(() => {
    if (pendingOrderId) {
      router.history.push(`/orders/${pendingOrderId}`)
    }
  }, [pendingOrderId, router])

  const name = draft.name ?? user?.name ?? ""
  const email = draft.email ?? user?.email ?? ""
  const walletList = wallets.data ?? []
  const selectedWallet =
    walletList.find((wallet) => wallet.id === draft.walletId) ??
    walletList.find((wallet) => wallet.kind === "primary") ??
    walletList[0]

  const connectionError = getApiError(connect.error ?? disconnect.error)?.message

  function validateForm(): FieldErrors {
    const found: FieldErrors = {}
    if (name.trim().length < 2) {
      found.name = "Informe seu nome."
    }
    const emailError = validateEmail(email)
    if (emailError) {
      found.email = emailError
    }
    if (!selectedWallet) {
      found.wallet = "Cadastre uma carteira para continuar."
    } else if (!selectedWallet.connected) {
      found.wallet = "Conecte a carteira selecionada para continuar."
    }
    return found
  }

  function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validateForm()
    setErrors(found)
    setNotice(null)
    if (Object.keys(found).length > 0 || !quote.data) {
      return
    }
    if (quote.data.lines.some((line) => !line.isAvailable)) {
      setNotice({ tone: "error", text: "Há itens indisponíveis no carrinho. Ajuste o carrinho antes de continuar." })
      return
    }
    setReviewedQuoteId(quote.data.id)
    setStep("review")
  }

  async function handleConfirm() {
    if (submitting.current || !selectedWallet) {
      return
    }
    submitting.current = true
    setIsSubmitting(true)
    setNotice(null)

    try {
      const fresh = await queryClient.fetchQuery({
        ...quoteQuery(ownerId, draft.couponCode, draft.network),
        staleTime: 0,
      })

      if (fresh.id !== reviewedQuoteId || fresh.lines.some((line) => !line.isAvailable)) {
        setReviewedQuoteId(fresh.id)
        setNotice({
          tone: "error",
          text: "Preço, cupom ou disponibilidade mudou. Revise o resumo atualizado e confirme novamente.",
        })
        return
      }

      const input: CreateOrderInput = {
        quoteId: fresh.id,
        walletId: selectedWallet.id,
        network: draft.network,
        couponCode: fresh.couponCode,
      }
      const signature = `${fresh.id}|${selectedWallet.id}|${draft.network}|${fresh.couponCode ?? ""}`
      const attempt =
        draft.attempt?.signature === signature
          ? draft.attempt
          : { key: crypto.randomUUID(), signature }
      updateDraft({ attempt })

      const order = await createOrder.mutateAsync({ input, key: attempt.key })
      updateDraft({ pendingOrderId: order.id, attempt: null })
      router.history.push(`/orders/${order.id}`)
    } catch (error) {
      const apiError = getApiError(error)
      if (apiError?.code === "AVAILABILITY_CONFLICT") {
        updateDraft({ attempt: null })
        const fresh = await queryClient.fetchQuery({
          ...quoteQuery(ownerId, draft.couponCode, draft.network),
          staleTime: 0,
        })
        setReviewedQuoteId(fresh.id)
        setNotice({ tone: "error", text: apiError.message })
      } else if (isNoResponse(error)) {
        setNotice({
          tone: "info",
          text: "Não recebemos resposta do servidor. Seu pedido pode ter sido criado. Toque em “Confirmar compra” de novo: usaremos a mesma solicitação, sem duplicar a compra.",
        })
      } else if (apiError?.fieldErrors?.couponCode) {
        setNotice({ tone: "error", text: `Cupom: ${apiError.fieldErrors.couponCode}` })
      } else {
        setNotice({ tone: "error", text: apiError?.message ?? "Não foi possível confirmar a compra." })
      }
    } finally {
      submitting.current = false
      setIsSubmitting(false)
    }
  }

  const data = quote.data
  const quoteChanged =
    step === "review" && reviewedQuoteId !== null && data !== undefined && data.id !== reviewedQuoteId

  if (quote.isPending) {
    return (
      <div role="status" aria-label="Carregando pagamento">
        <Skeleton className="mb-6 h-8 w-64" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    )
  }

  if (!data || data.lines.length === 0) {
    return (
      <div className="space-y-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Não há itens para pagar</h1>
        <Link to="/" className={buttonVariants()}>
          Explorar NFTs
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Pagamento com carteira</h1>

      <div aria-live="polite">
        {notice && (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className="mb-6 rounded-md border border-border bg-secondary p-4 text-sm"
          >
            {notice.text}
          </p>
        )}
      </div>

      <div className={`grid gap-10 lg:grid-cols-[1fr_332px] ${quote.isFetching ? "opacity-80" : ""}`}>
        {step === "form" ? (
          <form onSubmit={handleReview} noValidate className="space-y-8">
            <section aria-labelledby="collector-title" className="space-y-5">
              <h2 id="collector-title" className="border-b border-border pb-3 text-sm font-bold">
                Dados do colecionador
              </h2>
              <FormField
                id="checkout-name"
                label="Nome"
                value={name}
                onChange={(event) => updateDraft({ name: event.target.value })}
                autoComplete="name"
                error={errors.name}
              />
              <FormField
                id="checkout-email"
                label="E-mail"
                type="email"
                value={email}
                onChange={(event) => updateDraft({ email: event.target.value })}
                autoComplete="email"
                error={errors.email}
              />
            </section>

            <section aria-labelledby="wallet-title" className="space-y-5">
              <h2 id="wallet-title" className="border-b border-border pb-3 text-sm font-bold">
                Carteira e rede
              </h2>

              {wallets.isPending ? (
                <Skeleton className="h-24 w-full" />
              ) : walletList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Você ainda não cadastrou uma carteira.</p>
              ) : (
                <fieldset className="space-y-3">
                  <legend className="sr-only">Escolha a carteira</legend>
                  {walletList.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4"
                    >
                      <label className="flex flex-1 cursor-pointer items-center gap-3">
                        <input
                          type="radio"
                          name="wallet"
                          value={wallet.id}
                          checked={wallet.id === selectedWallet?.id}
                          onChange={() => updateDraft({ walletId: wallet.id, network: wallet.network })}
                          className="h-4 w-4 accent-[var(--primary)]"
                        />
                        <span className="text-sm">
                          <span className="block font-bold">
                            {wallet.label} ({wallet.kind === "primary" ? "principal" : "secundária"})
                          </span>
                          <span className="block text-muted-foreground">
                            {shortAddress(wallet.address)} · {networkLabel(wallet.network)}
                          </span>
                        </span>
                      </label>
                      <span className="text-xs">{wallet.connected ? "● Conectada" : "○ Desconectada"}</span>
                      {wallet.connected ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={disconnect.isPending}
                          onClick={() => disconnect.mutate(wallet.id)}
                        >
                          Desconectar
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={connect.isPending}
                          onClick={() => connect.mutate(wallet.id)}
                        >
                          {connect.isPending && connect.variables === wallet.id ? "Conectando…" : "Conectar"}
                        </Button>
                      )}
                    </div>
                  ))}
                </fieldset>
              )}

              {connectionError && (
                <p role="alert" className="text-sm text-destructive">
                  {connectionError}
                </p>
              )}
              {errors.wallet && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.wallet}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="checkout-network">Rede</Label>
                <NativeSelect
                  id="checkout-network"
                  value={draft.network}
                  onChange={(event) => updateDraft({ network: event.target.value as Network })}
                >
                  {NETWORKS.map((network) => (
                    <option key={network.value} value={network.value}>
                      {network.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </section>

            <Button type="submit" className="w-full sm:w-auto">
              Revisar pedido
            </Button>
          </form>
        ) : (
          <section aria-labelledby="review-title" className="space-y-6">
            <h2 id="review-title" className="border-b border-border pb-3 text-sm font-bold">
              Revise seu pedido
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Colecionador:</dt>
                <dd>
                  {name} ({email})
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Carteira:</dt>
                <dd>
                  {selectedWallet?.label} · {networkLabel(draft.network)}
                </dd>
              </div>
            </dl>
            <ul className="divide-y divide-border border-y border-border">
              {data.lines.map((line) => (
                <li key={line.editionId} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span>
                    {line.name} ({line.editionLabel}) × {line.quantity}
                  </span>
                  <span>{line.lineTotalEth} ETH</span>
                </li>
              ))}
            </ul>
            {quoteChanged && (
              <div role="alert" className="space-y-3 rounded-md border border-border bg-secondary p-4 text-sm">
                <p>
                  Os valores mudaram desde a sua revisão (preço, cupom ou disponibilidade). Confira o resumo
                  atualizado ao lado antes de continuar.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => setReviewedQuoteId(data.id)}>
                  Aceitar novos valores
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setStep("form")}>
                Editar dados
              </Button>
              <Button type="button" disabled={isSubmitting || quoteChanged} onClick={handleConfirm}>
                {isSubmitting ? "Confirmando…" : "Confirmar compra"}
              </Button>
            </div>
          </section>
        )}

        <aside aria-label="Resumo do pedido" className="space-y-4">
          <h2 className="border-b border-border pb-3 text-sm font-bold">Resumo da carteira</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{data.subtotalEth} ETH</dd>
            </div>
            <div className="flex justify-between">
              <dt>Desconto{data.couponCode ? ` (${data.couponCode})` : ""}</dt>
              <dd>(-) {data.discountEth} ETH</dd>
            </div>
            <div className="flex justify-between">
              <dt>Taxa de rede</dt>
              <dd>{data.networkFeeEth} ETH</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd>{data.totalEth} ETH</dd>
            </div>
          </dl>
          <Link to="/cart" className="block text-center text-sm underline">
            Voltar ao carrinho
          </Link>
        </aside>
      </div>
    </div>
  )
}
