import { setupWorker } from "msw/browser"
import { chaosHandlers } from "./chaos"
import { controls } from "./controls"
import { handlers } from "./handlers"
import { resumePendingOrders, socketHandlers } from "./realtime"
import { setPanelEnabled } from "./panel-flag"
import { applyPreset, hasStoredScenario } from "./scenarios"

export const worker = setupWorker(...chaosHandlers, ...handlers, ...socketHandlers)

declare global {
  interface Window {
    __mocks?: typeof controls
  }
}

export async function startMocks(): Promise<void> {
  window.__mocks = controls

  const params = new URLSearchParams(window.location.search)
  const requested = params.get("scenario")
  if (requested) {
    applyPreset(requested)
  } else if (!hasStoredScenario() && import.meta.env.VITE_MOCK_SCENARIO) {
    applyPreset(String(import.meta.env.VITE_MOCK_SCENARIO))
  }

  const panel = params.get("mocks")
  if (panel === "1" || panel === "0") {
    setPanelEnabled(panel === "1")
  }

  await worker.start({ onUnhandledRequest: "bypass" })
  resumePendingOrders()
}
