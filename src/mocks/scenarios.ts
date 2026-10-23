export type FailureMode = "none" | "network_error" | "http_500" | "http_503" | "http_429" | "http_403"
export type FailureScope = "all" | "catalog" | "cart" | "orders" | "auth"

export interface Scenario {
  epoch: number
  preset: string
  seed: number
  latencyMs: number
  jitterMs: number
  outOfOrder: boolean
  emptyCatalog: boolean
  failureMode: FailureMode
  failureScope: FailureScope
  failFirst: number
  paymentOutcome: "confirm" | "decline"
  failFavorites: boolean
  walletRefuses: boolean
  orderTimeoutOnce: boolean
  socketBlocked: boolean
}

export interface Preset {
  label: string
  description: string
  settings: Partial<Scenario>
}

const STORAGE_KEY = "mock-scenario-v2"

export const DEFAULT_SCENARIO: Scenario = {
  epoch: 0,
  preset: "default",
  seed: 1337,
  latencyMs: 300,
  jitterMs: 0,
  outOfOrder: false,
  emptyCatalog: false,
  failureMode: "none",
  failureScope: "all",
  failFirst: 0,
  paymentOutcome: "confirm",
  failFavorites: false,
  walletRefuses: false,
  orderTimeoutOnce: false,
  socketBlocked: false,
}

export const PRESETS: Record<string, Preset> = {
  default: { label: "Padrão (sucesso)", description: "Tudo funciona, latência de 300 ms.", settings: {} },
  empty: { label: "Catálogo vazio", description: "A listagem não retorna nenhum NFT.", settings: { emptyCatalog: true } },
  slow: { label: "Rede lenta", description: "Cada resposta demora 2,5 s.", settings: { latencyMs: 2500 } },
  "variable-latency": {
    label: "Latência variável",
    description: "400 ms + até 1,5 s de variação reproduzível (seed fixa).",
    settings: { latencyMs: 400, jitterMs: 1500 },
  },
  "out-of-order": {
    label: "Respostas fora de ordem",
    description: "Buscas ímpares demoram 1,8 s e as pares 0,1 s: a resposta antiga chega depois da nova.",
    settings: { outOfOrder: true },
  },
  offline: {
    label: "Sem conexão (catálogo)",
    description: "Toda chamada ao catálogo falha como erro de rede.",
    settings: { failureMode: "network_error", failureScope: "catalog" },
  },
  "server-error": {
    label: "Erro 500 (catálogo)",
    description: "Toda chamada ao catálogo responde HTTP 500.",
    settings: { failureMode: "http_500", failureScope: "catalog" },
  },
  flaky: {
    label: "Instável (recupera na 4ª tentativa)",
    description: "As 3 primeiras chamadas ao catálogo falham; depois funciona. Use “Tentar novamente”.",
    settings: { failureMode: "network_error", failureScope: "catalog", failFirst: 3 },
  },
  "payment-declined": {
    label: "Pagamento recusado",
    description: "Os próximos pedidos terminam como recusados.",
    settings: { paymentOutcome: "decline" },
  },
  "order-timeout": {
    label: "Timeout após criar o pedido",
    description: "A próxima compra cria o pedido, mas a resposta demora 12 s (o cliente desiste em 10 s).",
    settings: { orderTimeoutOnce: true },
  },
  "wallet-refused": {
    label: "Carteira recusa conexão",
    description: "Conectar carteira retorna 403.",
    settings: { walletRefuses: true },
  },
  "favorites-fail": {
    label: "Favoritos falham",
    description: "Favoritar/desfavoritar responde 503 (testa o rollback).",
    settings: { failFavorites: true },
  },
  "socket-down": {
    label: "Tempo real indisponível",
    description: "O servidor de eventos recusa conexões; a interface deve seguir funcionando via REST.",
    settings: { socketBlocked: true },
  },
}

function read(): Scenario {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SCENARIO, ...(JSON.parse(raw) as Partial<Scenario>) } : DEFAULT_SCENARIO
  } catch {
    return DEFAULT_SCENARIO
  }
}

function write(next: Scenario): Scenario {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // sem persistência: o cenário volta ao padrão no próximo carregamento
  }
  return next
}

export function getScenario(): Scenario {
  return read()
}

export function hasStoredScenario(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

export function setScenario(partial: Partial<Scenario>): Scenario {
  const current = read()
  return write({ ...current, ...partial, epoch: current.epoch + 1 })
}

export function applyPreset(name: string): Scenario {
  const preset = PRESETS[name] as Preset | undefined
  const current = read()
  if (!preset) {
    return current
  }
  return write({ ...DEFAULT_SCENARIO, ...preset.settings, preset: name, epoch: current.epoch + 1 })
}

export function resetScenario(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // nada a fazer
  }
}
