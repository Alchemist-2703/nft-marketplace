import { useState, type FormEvent } from "react"
import { useRouter, useSearch } from "@tanstack/react-router"
import { getApiError, isNoResponse } from "@/api/errors"
import { FormField } from "@/components/FormField"
import { Button } from "@/components/ui/button"
import { AuthCard } from "@/features/auth/AuthCard"
import { useLogin } from "@/features/auth/queries"
import { safeRedirect } from "@/features/auth/search"
import { validateLogin, type FieldErrors } from "@/features/auth/validation"

export function LoginPage() {
  const search = useSearch({ from: "/login" })
  const router = useRouter()
  const login = useLogin()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const input = {
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    }

    const validation = validateLogin(input)
    setErrors(validation)
    setFormError(null)
    if (Object.keys(validation).length > 0) {
      return
    }

    try {
      await login.mutateAsync(input)
      router.history.push(safeRedirect(search.redirect))
    } catch (error) {
      const apiError = getApiError(error)
      if (apiError?.fieldErrors) {
        setErrors(apiError.fieldErrors)
      } else if (isNoResponse(error)) {
        setFormError("Não foi possível conectar ao servidor. Verifique sua conexão e tente de novo.")
      } else {
        setFormError(apiError?.message ?? "Não foi possível entrar. Tente novamente.")
      }
    }
  }

  return (
    <AuthCard
      active="login"
      redirect={search.redirect}
      description="Entre para gerenciar sua carteira, coleção e perfil."
    >
      {search.expired && (
        <p role="status" className="mb-6 rounded-md border border-border bg-secondary p-3 text-sm">
          Sua sessão expirou. Entre novamente para retomar de onde parou.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField
          id="login-email"
          name="email"
          type="email"
          label="E-mail"
          autoComplete="email"
          placeholder="contato@email.com"
          error={errors.email}
        />
        <FormField
          id="login-password"
          name="password"
          type="password"
          label="Senha"
          autoComplete="current-password"
          error={errors.password}
        />

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? "Entrando…" : "Entrar"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Contas de teste: ana@kurio.dev (Senha@123) e bruno@kurio.dev (Senha@456).
        </p>
      </form>
    </AuthCard>
  )
}
