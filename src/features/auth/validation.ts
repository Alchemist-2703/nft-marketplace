export type FieldErrors = Record<string, string>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value: string): string | undefined {
  if (value.trim() === "") {
    return "Informe seu e-mail."
  }
  return EMAIL_PATTERN.test(value.trim()) ? undefined : "Informe um e-mail válido."
}

export function validatePassword(value: string): string | undefined {
  if (value.length < 8 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "A senha deve ter ao menos 8 caracteres, com letras e números."
  }
  return undefined
}

export function validateLogin(input: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {}
  const email = validateEmail(input.email)
  if (email) {
    errors.email = email
  }
  if (input.password === "") {
    errors.password = "Informe sua senha."
  }
  return errors
}

export function validateRegister(input: {
  name: string
  email: string
  password: string
  confirmPassword: string
}): FieldErrors {
  const errors: FieldErrors = {}
  if (input.name.trim().length < 2) {
    errors.name = "Informe um nome de usuário com ao menos 2 caracteres."
  }
  const email = validateEmail(input.email)
  if (email) {
    errors.email = email
  }
  const password = validatePassword(input.password)
  if (password) {
    errors.password = password
  }
  if (input.confirmPassword !== input.password) {
    errors.confirmPassword = "As senhas não conferem."
  }
  return errors
}
