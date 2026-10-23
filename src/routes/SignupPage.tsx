import { useState, type FormEvent } from "react"
import { useRouter, useSearch } from "@tanstack/react-router"
import { getApiError, isNoResponse } from "@/api/errors"
import { FormField } from "@/components/FormField"
import { Button } from "@/components/ui/button"
import { AuthCard } from "@/features/auth/AuthCard"
import { useRegister } from "@/features/auth/queries"
import { safeRedirect } from "@/features/auth/search"
import { validateRegister, type FieldErrors } from "@/features/auth/validation"

export function SignupPage() {
  const search = useSearch({ from: "/signup" })
  const router = useRouter()
  const register = useRegister()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const input = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
      confirmPassword: String(data.get("confirmPassword") ?? ""),
    }

    const validation = validateRegister(input)
    setErrors(validation)
    setFormError(null)
    if (Object.keys(validation).length > 0) {
      return
    }

    try {
      await register.mutateAsync({ name: input.name, email: input.email, password: input.password })
      router.history.push(safeRedirect(search.redirect))
    } catch (error) {
      const apiError = getApiError(error)
      if (apiError?.fieldErrors) {
        setErrors(apiError.fieldErrors)
      } else if (isNoResponse(error)) {
        setFormError("Não foi possível conectar ao servidor. Verifique sua conexão e tente de novo.")
      } else {
        setFormError(apiError?.message ?? "Não foi possível criar a conta. Tente novamente.")
      }
    }
  }

  return (
    <AuthCard
      active="signup"
      redirect={search.redirect}
      description="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField
          id="signup-name"
          name="name"
          label="Nome de usuário"
          autoComplete="username"
          error={errors.name}
        />
        <FormField
          id="signup-email"
          name="email"
          type="email"
          label="E-mail"
          autoComplete="email"
          error={errors.email}
        />
        <FormField
          id="signup-password"
          name="password"
          type="password"
          label="Senha"
          autoComplete="new-password"
          hint="Ao menos 8 caracteres, com letras e números."
          error={errors.password}
        />
        <FormField
          id="signup-confirm"
          name="confirmPassword"
          type="password"
          label="Confirmar senha"
          autoComplete="new-password"
          error={errors.confirmPassword}
        />

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>
    </AuthCard>
  )
}
