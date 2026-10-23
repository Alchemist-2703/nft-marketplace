const KEY = "mock-panel"

export function isPanelEnabled(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1"
  } catch {
    return false
  }
}

export function setPanelEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      window.localStorage.setItem(KEY, "1")
    } else {
      window.localStorage.removeItem(KEY)
    }
  } catch {
    // sem persistência
  }
}
