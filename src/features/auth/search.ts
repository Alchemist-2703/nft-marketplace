export interface AuthSearch {
  redirect?: string
  expired?: boolean
}

export function safeRedirect(value: string | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/"
}

export function parseAuthSearch(search: Record<string, unknown>): AuthSearch {
  return {
    redirect:
      typeof search.redirect === "string" && search.redirect.startsWith("/") && !search.redirect.startsWith("//")
        ? search.redirect
        : undefined,
    expired: search.expired === true || search.expired === "true" ? true : undefined,
  }
}
