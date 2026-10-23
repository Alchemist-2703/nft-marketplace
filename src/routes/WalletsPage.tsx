import { useState } from "react"
import { getApiError } from "@/api/errors"
import { Skeleton } from "@/components/Skeleton"
import { Button } from "@/components/ui/button"
import { AccountLayout } from "@/features/account/AccountLayout"
import { networkLabel } from "@/features/checkout/constants"
import { WalletForm } from "@/features/wallets/WalletForm"
import { useWalletConnection, useWallets } from "@/features/wallets/hooks"
import type { Wallet, WalletKind } from "@/types/user"

const KIND_LABEL: Record<WalletKind, string> = {
  primary: "Carteira principal",
  secondary: "Carteira secundária",
}

function WalletSlot({ kind, wallet }: { kind: WalletKind; wallet: Wallet | null }) {
  const [editing, setEditing] = useState(false)
  const { connect, disconnect } = useWalletConnection()
  const titleId = `slot-${kind}`
  const connectionError = getApiError(connect.error ?? disconnect.error)?.message

  return (
    <section aria-labelledby={titleId} className="rounded-xl border border-border bg-card p-5">
      <h2 id={titleId} className="mb-4 text-sm font-bold">
        {KIND_LABEL[kind]}
      </h2>

      {editing ? (
        <WalletForm kind={kind} wallet={wallet} onDone={() => setEditing(false)} />
      ) : wallet ? (
        <div className="space-y-4">
          <dl className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <dt className="text-muted-foreground">Apelido:</dt>
              <dd>{wallet.label}</dd>
            </div>
            <div className="flex flex-wrap gap-2">
              <dt className="text-muted-foreground">Endereço:</dt>
              <dd className="break-all">{wallet.address}</dd>
            </div>
            <div className="flex flex-wrap gap-2">
              <dt className="text-muted-foreground">Rede:</dt>
              <dd>{networkLabel(wallet.network)}</dd>
            </div>
            <div className="flex flex-wrap gap-2">
              <dt className="text-muted-foreground">Status:</dt>
              <dd>{wallet.connected ? "● Conectada" : "○ Desconectada"}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              Editar
            </Button>
            {wallet.connected ? (
              <Button
                type="button"
                variant="outline"
                disabled={disconnect.isPending}
                onClick={() => disconnect.mutate(wallet.id)}
              >
                Desconectar
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={connect.isPending}
                onClick={() => connect.mutate(wallet.id)}
              >
                {connect.isPending ? "Conectando…" : "Conectar"}
              </Button>
            )}
          </div>
          {connectionError && (
            <p role="alert" className="text-sm text-destructive">
              {connectionError}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Você ainda não cadastrou esta carteira.</p>
          <Button type="button" onClick={() => setEditing(true)}>
            Cadastrar carteira
          </Button>
        </div>
      )}
    </section>
  )
}

export function WalletsPage() {
  const wallets = useWallets()

  return (
    <AccountLayout active="wallets" title="Carteiras">
      {wallets.isPending ? (
        <div role="status" aria-label="Carregando carteiras" className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : wallets.isError ? (
        <div role="alert" className="space-y-4">
          <p>Não foi possível carregar suas carteiras.</p>
          <Button onClick={() => wallets.refetch()}>Tentar novamente</Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <WalletSlot
            kind="primary"
            wallet={wallets.data.find((wallet) => wallet.kind === "primary") ?? null}
          />
          <WalletSlot
            kind="secondary"
            wallet={wallets.data.find((wallet) => wallet.kind === "secondary") ?? null}
          />
        </div>
      )}
    </AccountLayout>
  )
}
