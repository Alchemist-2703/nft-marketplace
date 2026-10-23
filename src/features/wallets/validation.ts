import type { FieldErrors } from "../auth/validation"

export function validateWalletForm(input: { label: string; address: string }): FieldErrors {
  const errors: FieldErrors = {}
  const label = input.label.trim()
  if (label.length < 2 || label.length > 30) {
    errors.label = "O apelido deve ter entre 2 e 30 caracteres."
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(input.address.trim())) {
    errors.address = "Endereço inválido. Use 0x seguido de 40 caracteres hexadecimais."
  }
  return errors
}
