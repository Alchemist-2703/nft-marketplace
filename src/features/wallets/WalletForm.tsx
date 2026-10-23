import { useState, type FormEvent } from "react"
import { getApiError, isNoResponse } from "@/api/errors"
import { FormField } from "@/components/FormField"
import { NativeSelect } from "@/components/NativeSelect"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { NETWORKS } from "@/features/checkout/constants"
import type { FieldErrors } from "@/features/auth/validation"
import type { Network, Wallet, WalletKind } from "@/types/user"
import { useSaveWallet } from "./hooks"
import { validateWalletForm } from "./validation"

interface WalletFormProps {
  kind: WalletKind
  wallet: Wallet | null
  onDone: () => void
}

export function WalletForm({ kind, wallet, onDone }: WalletFormProps) {
  const save = useSaveWallet(wallet?.id ?? null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const prefix = `wallet-${kind}`

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const input = {
      kind,
      label: String(data.get("label") ?? "").trim(),
      address: String(data.get("address") ?? "").trim(),
      network: String(data.get("network") ?? "ethereum") as Network,
    }

    const found = validateWalletForm(input)
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) {
      return
    }

    try {
      await save.mutateAsync(input)
      onDone()
    } catch (error) {
      const apiError = getApiError(error)
      if (apiError?.fieldErrors) {
        setErrors(apiError.fieldErrors)
      } else if (isNoResponse(error)) {
        setFormError("Não foi possível conectar ao servidor. Tente de novo.")
      } else {
        setFormError(apiError?.message ?? "Não foi possível salvar a carteira.")
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormField
        id={`${prefix}-label`}
        name="label"
        label="Apelido"
        defaultValue={wallet?.label ?? ""}
        error={errors.label}
      />
      <FormField
        id={`${prefix}-address`}
        name="address"
        label="Endereço da carteira"
        defaultValue={wallet?.address ?? ""}
        placeholder="0x…"
        autoComplete="off"
        spellCheck={false}
        error={errors.address}
      />
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-network`}>Rede</Label>
        <NativeSelect
          id={`${prefix}-network`}
          name="network"
          defaultValue={wallet?.network ?? "ethereum"}
          aria-invalid={errors.network ? true : undefined}
        >
          {NETWORKS.map((network) => (
            <option key={network.value} value={network.value}>
              {network.label}
            </option>
          ))}
        </NativeSelect>
        {errors.network && (
          <p role="alert" className="text-sm text-destructive">
            {errors.network}
          </p>
        )}
      </div>

      {errors.kind && (
        <p role="alert" className="text-sm text-destructive">
          {errors.kind}
        </p>
      )}
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Salvando…" : wallet ? "Salvar carteira" : "Cadastrar carteira"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
