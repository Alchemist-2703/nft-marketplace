import { useState } from "react"
import { controls } from "../controls"
import { getScenario } from "../scenarios"
import { setPanelEnabled } from "../panel-flag"

export default function MockPanel() {
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState(() => getScenario().preset)
  const [feedback, setFeedback] = useState("")
  const [ticker, setTicker] = useState(() => controls.isTickerRunning())

  function run(label: string, action: () => boolean | void) {
    const result = action()
    setFeedback(result === false ? `${label}: nada a fazer (ex.: carrinho vazio).` : `${label}: ok.`)
  }

  function handlePreset(name: string) {
    controls.useScenario(name)
    setPreset(name)
    setFeedback(`Cenário “${controls.presets[name].label}” aplicado.`)
  }

  const current = controls.presets[preset]

  return (
    <aside
      aria-label="Painel de cenários do servidor simulado"
      className="fixed bottom-3 right-3 z-50 max-w-[calc(100vw-1.5rem)]"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mock-panel-body"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold shadow-lg"
      >
        {open ? "Fechar cenários" : "Cenários"}
      </button>

      {open && (
        <div
          id="mock-panel-body"
          className="mt-2 max-h-[70vh] w-[340px] max-w-full space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-4 text-xs shadow-lg"
        >
          <div className="space-y-1">
            <label htmlFor="mock-preset" className="font-bold">
              Cenário de rede e falhas
            </label>
            <select
              id="mock-preset"
              value={preset}
              onChange={(event) => handlePreset(event.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-2"
            >
              {Object.entries(controls.presets).map(([name, item]) => (
                <option key={name} value={name}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground">{current.description}</p>
          </div>

          <div className="space-y-2">
            <p className="font-bold">Eventos em tempo real</p>
            <div className="flex flex-wrap gap-2">
              <PanelButton onClick={() => run("Preço +10% no carrinho", () => controls.bumpCartPrice(10))}>
                Subir preço do item no carrinho
              </PanelButton>
              <PanelButton onClick={() => run("Preço do NFT aberto +10%", () => controls.bumpOpenNft(10))}>
                Subir preço do NFT aberto
              </PanelButton>
              <PanelButton
                onClick={() => {
                  if (ticker) {
                    controls.stopPriceTicker()
                  } else {
                    controls.startPriceTicker(6000)
                  }
                  setTicker(!ticker)
                  setFeedback(ticker ? "Variação automática parada." : "Variação automática a cada 6 s.")
                }}
              >
                {ticker ? "Parar variação automática de preços" : "Iniciar variação automática de preços"}
              </PanelButton>
              <PanelButton onClick={() => run("Esgotar item do carrinho", () => controls.soldOutCartItem())}>
                Esgotar item do carrinho
              </PanelButton>
              <PanelButton onClick={() => run("Evento duplicado", () => controls.realtime.replayLastEvent())}>
                Reenviar último evento
              </PanelButton>
              <PanelButton onClick={() => run("Evento antigo", () => controls.realtime.emitStaleEvent())}>
                Enviar evento antigo
              </PanelButton>
              <PanelButton onClick={() => run("Conexão derrubada", () => controls.realtime.dropConnections())}>
                Derrubar conexão
              </PanelButton>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-bold">Sessão e dados</p>
            <div className="flex flex-wrap gap-2">
              <PanelButton onClick={() => run("Sessão expirada no servidor", () => controls.expireSession())}>
                Expirar sessão
              </PanelButton>
              <PanelButton onClick={() => controls.reset()}>Resetar tudo</PanelButton>
              <PanelButton
                onClick={() => {
                  setPanelEnabled(false)
                  window.location.reload()
                }}
              >
                Ocultar painel
              </PanelButton>
            </div>
          </div>

          <p role="status" className="text-muted-foreground">
            {feedback}
          </p>
        </div>
      )}
    </aside>
  )
}

function PanelButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border px-3 py-2 text-left hover:bg-secondary"
    >
      {children}
    </button>
  )
}
