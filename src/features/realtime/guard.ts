interface GuardedEvent {
  eventId: string
  resource: string
  resourceId: string
  version: number
}

const MAX_REMEMBERED = 500

export function createEventGuard() {
  const seen = new Set<string>()
  const versions = new Map<string, number>()

  return {
    accept(event: GuardedEvent): boolean {
      if (seen.has(event.eventId)) {
        return false
      }
      seen.add(event.eventId)
      if (seen.size > MAX_REMEMBERED) {
        const oldest = seen.values().next().value
        if (oldest !== undefined) {
          seen.delete(oldest)
        }
      }

      const key = `${event.resource}:${event.resourceId}`
      const last = versions.get(key) ?? 0
      if (event.version <= last) {
        return false
      }
      versions.set(key, event.version)
      return true
    },
  }
}
