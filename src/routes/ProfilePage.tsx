import { useState, type ChangeEvent, type FormEvent } from "react"
import { getApiError, isNoResponse } from "@/api/errors"
import { FormField } from "@/components/FormField"
import { Skeleton } from "@/components/Skeleton"
import { Button } from "@/components/ui/button"
import { AccountLayout } from "@/features/account/AccountLayout"
import { useSession } from "@/features/auth/queries"
import { validateEmail, validatePassword, type FieldErrors } from "@/features/auth/validation"
import { useChangePassword, useUpdateProfile } from "@/features/profile/hooks"

const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"]
const AVATAR_MAX_BYTES = 300 * 1024

function messageFor(error: unknown, fallback: string): string {
  if (isNoResponse(error)) {
    return "Não foi possível conectar ao servidor. Tente de novo."
  }
  return getApiError(error)?.message ?? fallback
}

export function ProfilePage() {
  const { user } = useSession()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const [profileErrors, setProfileErrors] = useState<FieldErrors>({})
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({})
  const [avatarDraft, setAvatarDraft] = useState<string | null | undefined>(undefined)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  if (!user) {
    return (
      <AccountLayout active="profile" title="Perfil do colecionador">
        <div role="status" aria-label="Carregando perfil">
          <Skeleton className="h-64 w-full" />
        </div>
      </AccountLayout>
    )
  }

  const avatar = avatarDraft === undefined ? user.avatarUrl : avatarDraft

  function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Use uma imagem PNG, JPG ou WebP.")
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError("A imagem deve ter até 300 KB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarDraft(reader.result)
        setAvatarError(null)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    const email = String(data.get("email") ?? "").trim()

    const found: FieldErrors = {}
    if (name.length < 2) {
      found.name = "Informe um nome com ao menos 2 caracteres."
    }
    const emailError = validateEmail(email)
    if (emailError) {
      found.email = emailError
    }
    setProfileErrors(found)
    if (Object.keys(found).length > 0) {
      return
    }

    try {
      await updateProfile.mutateAsync({ name, email, avatarUrl: avatar })
      setAvatarDraft(undefined)
    } catch (error) {
      const fieldErrors = getApiError(error)?.fieldErrors
      if (fieldErrors) {
        setProfileErrors(fieldErrors)
        if (fieldErrors.avatarUrl) {
          setAvatarError(fieldErrors.avatarUrl)
        }
      }
    }
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const currentPassword = String(data.get("currentPassword") ?? "")
    const newPassword = String(data.get("newPassword") ?? "")
    const confirmPassword = String(data.get("confirmPassword") ?? "")

    const found: FieldErrors = {}
    if (currentPassword === "") {
      found.currentPassword = "Informe sua senha atual."
    }
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      found.newPassword = passwordError
    }
    if (confirmPassword !== newPassword) {
      found.confirmPassword = "As senhas não conferem."
    }
    setPasswordErrors(found)
    if (Object.keys(found).length > 0) {
      return
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword })
      form.reset()
    } catch (error) {
      const fieldErrors = getApiError(error)?.fieldErrors
      if (fieldErrors) {
        setPasswordErrors(fieldErrors)
      }
    }
  }

  const profileFormError =
    updateProfile.isError && !getApiError(updateProfile.error)?.fieldErrors
      ? messageFor(updateProfile.error, "Não foi possível salvar o perfil.")
      : null
  const passwordFormError =
    changePassword.isError && !getApiError(changePassword.error)?.fieldErrors
      ? messageFor(changePassword.error, "Não foi possível alterar a senha.")
      : null

  return (
    <AccountLayout active="profile" title="Perfil do colecionador">
      <form onSubmit={handleProfile} noValidate className="max-w-xl space-y-5" aria-label="Dados do perfil">
        <div className="flex flex-wrap items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="Seu avatar" width={80} height={80} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span
              role="img"
              aria-label="Sem avatar"
              className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-2xl font-bold"
            >
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="space-y-2">
            <label htmlFor="avatar-file" className="block text-sm font-medium">
              Avatar (PNG, JPG ou WebP, até 300 KB)
            </label>
            <input
              id="avatar-file"
              type="file"
              accept={AVATAR_TYPES.join(",")}
              onChange={handleAvatar}
              aria-describedby={avatarError ? "avatar-error" : undefined}
              className="block max-w-full text-sm"
            />
            {avatar && (
              <Button type="button" variant="outline" size="sm" onClick={() => setAvatarDraft(null)}>
                Remover avatar
              </Button>
            )}
            {avatarError && (
              <p id="avatar-error" role="alert" className="text-sm text-destructive">
                {avatarError}
              </p>
            )}
          </div>
        </div>

        <FormField
          id="profile-name"
          name="name"
          label="Nome"
          defaultValue={user.name}
          autoComplete="name"
          error={profileErrors.name}
        />
        <FormField
          id="profile-email"
          name="email"
          type="email"
          label="E-mail"
          defaultValue={user.email}
          autoComplete="email"
          error={profileErrors.email}
        />

        {profileFormError && (
          <p role="alert" className="text-sm text-destructive">
            {profileFormError}
          </p>
        )}
        <div aria-live="polite">
          {updateProfile.isSuccess && <p className="text-sm">Alterações salvas.</p>}
        </div>
        <Button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </form>

      <form onSubmit={handlePassword} noValidate className="max-w-xl space-y-5" aria-label="Alterar senha">
        <h2 className="border-b border-border pb-3 text-sm font-bold">Alterar senha</h2>
        <FormField
          id="password-current"
          name="currentPassword"
          type="password"
          label="Senha atual"
          autoComplete="current-password"
          error={passwordErrors.currentPassword}
        />
        <FormField
          id="password-new"
          name="newPassword"
          type="password"
          label="Nova senha"
          autoComplete="new-password"
          hint="Ao menos 8 caracteres, com letras e números."
          error={passwordErrors.newPassword}
        />
        <FormField
          id="password-confirm"
          name="confirmPassword"
          type="password"
          label="Confirmar nova senha"
          autoComplete="new-password"
          error={passwordErrors.confirmPassword}
        />

        {passwordFormError && (
          <p role="alert" className="text-sm text-destructive">
            {passwordFormError}
          </p>
        )}
        <div aria-live="polite">
          {changePassword.isSuccess && <p className="text-sm">Senha alterada com sucesso.</p>}
        </div>
        <Button type="submit" disabled={changePassword.isPending}>
          {changePassword.isPending ? "Alterando…" : "Alterar senha"}
        </Button>
      </form>
    </AccountLayout>
  )
}
