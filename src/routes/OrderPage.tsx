import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useParams } from "@tanstack/react-router"
import { getStatus } from "@/api/errors"
import { getOrder } from "@/api/orders"
import { Skeleton } from "@/components/Skeleton"
import { Button, buttonVariants } from "@/components/ui/button"
import { useOwnerId } from "@/features/auth/queries"
import { updateDraft } from "@/features/checkout/checkout-store"
import { networkLabel, shortAddress } from "@/features/checkout/constants"

export function OrderPage() {
  const { orderId } = useParams({ from: "/orders/$orderId" })
  const ownerId = useOwnerId()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["order", ownerId, orderId] as const,
    queryFn: ({ signal }) => getOrder(orderId, signal),
    refetchInterval: (current) => (current.state.data?.status === "pending" ? 1500 : false),
    retry: (count, error) => {
      const status = getStatus(error)
      return status === null || status >= 500 ? count < 3 : false
    },
  })

  const status = query.data?.status
  useEffect(() => {
    if (status === "confirmed" || status === "declined") {
      updateDraft(
        status === "confirmed"
          ? { pendingOrderId: null, attempt: null, couponCode: null }
          : { pendingOrderId: null, attempt: null },
      )
      void queryClient.invalidateQueries({ queryKey: ["cart"] })
      void queryClient.invalidateQueries({ queryKey: ["quote"] })
      void queryClient.invalidateQueries({ queryKey: ["nfts"] })
    }
  }, [status, queryClient])

  if (query.isPending) {
    return (
      <div role="status" aria-label="Carregando pedido" className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-40 w-full" />
        <span className="sr-only">Carregando pedido...</span>
      </div>
    )
  }

  if (query.isError && !query.data) {
    if (getStatus(query.error) === 404) {
      return (
        <div role="alert" className="py-16 text-center">
          <h1 className="mb-4 text-2xl font-bold">Pedido não encontrado</h1>
          <Link to="/" className="underline">
            Voltar ao catálogo
          </Link>
        </div>
      )
    }
    return (
      <div role="alert" className="space-y-4 py-16 text-center">
        <p>Não foi possível carregar o pedido. Ele não foi duplicado: você pode tentar de novo.</p>
        <Button onClick={() => query.refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  const order = query.data

  if (order.status === "pending") {
    return (
      <div role="status" className="mx-auto max-w-xl space-y-4 rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Aguardando confirmação</h1>
        <p className="text-sm text-muted-foreground">
          Pedido {order.id}. Estamos aguardando a rede confirmar a transação. Você pode recarregar esta
          página: retomamos de onde parou, sem criar outra compra.
        </p>
        <Skeleton className="mx-auto h-2 w-48" />
        {query.isRefetchError && (
          <p className="text-sm">Conexão instável. Tentando reconectar…</p>
        )}
      </div>
    )
  }

  if (order.status === "declined") {
    return (
      <div role="alert" className="mx-auto max-w-xl space-y-4 rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Pagamento recusado</h1>
        <p className="text-sm text-muted-foreground">
          {order.declineReason ?? "O pagamento não foi aprovado."} Seus itens continuam no carrinho.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/checkout" className={buttonVariants()}>
            Voltar ao pagamento
          </Link>
          <Link to="/cart" className={buttonVariants({ variant: "outline" })}>
            Ver carrinho
          </Link>
        </div>
      </div>
    )
  }

  return (
    <article aria-labelledby="receipt-title" className="mx-auto max-w-[578px] rounded-xl border border-border bg-card">
      <header className="border-b border-border p-8 text-center">
        <h1 id="receipt-title" className="text-lg font-bold">
          Seus NFTs agora estão na sua carteira
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Pedido {order.id} confirmado.</p>
      </header>

      <dl className="grid grid-cols-2 gap-4 border-b border-border p-6 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">ID da transação</dt>
          <dd>{order.transactionHash ? shortAddress(order.transactionHash) : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Data</dt>
          <dd>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Total</dt>
          <dd>{order.totalEth} ETH</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Carteira</dt>
          <dd>{order.walletLabel}</dd>
        </div>
      </dl>

      <section aria-labelledby="receipt-details" className="space-y-4 p-6">
        <h2 id="receipt-details" className="text-sm font-bold">
          Detalhes da transação
        </h2>
        <ul className="divide-y divide-border border-y border-border">
          {order.items.map((item) => (
            <li key={item.editionId} className="flex items-center gap-4 py-3 text-sm">
              <img src={item.image} alt={item.name} width={56} height={56} className="h-14 w-14 rounded-md object-cover" />
              <div className="flex-1">
                <p className="font-bold">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  ID do token: {item.tokenId} · {item.editionLabel}
                </p>
              </div>
              <span className="text-right">
                (x {item.quantity})<br />
                {item.lineTotalEth} ETH
              </span>
            </li>
          ))}
        </ul>
        <dl className="ml-auto max-w-[321px] space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{order.subtotalEth} ETH</dd>
          </div>
          <div className="flex justify-between">
            <dt>Desconto</dt>
            <dd>(-) {order.discountEth} ETH</dd>
          </div>
          <div className="flex justify-between">
            <dt>Taxa de rede ({networkLabel(order.network)})</dt>
            <dd>{order.networkFeeEth} ETH</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-bold">
            <dt>Total</dt>
            <dd>{order.totalEth} ETH</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Transação confirmada na simulação. A referência e o link do explorador são fictícios.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {order.explorerUrl && (
            <a
              href={order.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              Ver no Etherscan
            </a>
          )}
          <Link to="/" className={buttonVariants()}>
            Continuar explorando
          </Link>
        </div>
      </section>
    </article>
  )
}
