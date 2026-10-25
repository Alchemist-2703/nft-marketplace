import { Link } from "@tanstack/react-router"

const FEATURES = [
  { letter: "W", title: "Segurança da carteira", text: "Proteja sua carteira e colecione arte digital verificada com confiança." },
  { letter: "C", title: "Criadores em destaque", text: "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede." },
  { letter: "D", title: "Alertas de lançamentos", text: "Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado." },
]

const COLUMNS = [
  { title: "Meu perfil", items: ["Meu perfil", "Minha coleção", "Atividade", "Estúdio do criador", "Lista de interesse"] },
  { title: "Central de ajuda", items: ["Central de ajuda", "Como comprar NFTs", "Carteira e segurança", "Política do mercado", "Denunciar item"] },
  { title: "Coleções", items: ["Arte digital", "Fotografia", "Música", "Arte 3D", "Utilidade"] },
]

export function SiteFooter() {
  return (
    <footer className="mt-24">
      <div className="bg-card px-6 py-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="space-y-3">
              <span
                aria-hidden="true"
                className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
              >
                {feature.letter}
              </span>
              <p className="text-[17px] font-bold">{feature.title}</p>
              <p className="text-sm leading-[22px] text-muted-foreground">{feature.text}</p>
            </div>
          ))}
          <form onSubmit={(event) => event.preventDefault()} aria-label="Newsletter">
            <fieldset disabled className="space-y-3">
              <legend className="mb-3 text-lg font-bold">Antecipe-se ao próximo lançamento</legend>
              <div className="flex">
                <input
                  type="email"
                  aria-label="Newsletter"
                  placeholder="digite seu e-mail..."
                  className="h-10 min-w-0 flex-1 rounded-l-md bg-surface-dark px-3 text-sm"
                />
                <button type="submit" className="h-10 rounded-r-md bg-primary px-4 text-lg font-bold text-primary-foreground opacity-60">
                  Enviar
                </button>
              </div>
              <p className="text-xs leading-[22px] text-muted-foreground">
                Cadastro de novidades indisponível nesta versão.
              </p>
            </fieldset>
          </form>
        </div>
      </div>

      <div className="bg-surface-dark px-6 py-6">
        <div className="mx-auto grid max-w-7xl gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4 lg:items-center">
          <p className="font-bold tracking-[0.1em]">KURIO</p>
          <p className="leading-[22px]">Feito para colecionadores, criadores e cultura</p>
          <a href="mailto:contato@email.com" className="underline">
            contato@email.com
          </a>
          <p>+55 11 4002 8922</p>
        </div>
      </div>

      <div className="bg-card px-6 py-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.title} className="space-y-2">
              <p className="text-lg font-bold">{column.title}</p>
              <ul className="text-sm leading-[30px]">
                {column.items.map((item, index) => (
                  <li key={item}>
                    {column.title === "Meu perfil" && index === 0 ? (
                      <Link to="/profile" className="underline">
                        {item}
                      </Link>
                    ) : (
                      item
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="space-y-3">
            <p className="text-lg font-bold">Carteiras compatíveis</p>
            <p className="rounded-md border border-border-soft bg-surface-dark px-2 py-2 text-[9px] font-bold tracking-[0.1px] text-highlight">
              METAMASK • WALLETCONNECT • COINBASE
            </p>
          </div>
        </div>
        <p className="mt-6 text-center text-sm leading-[30px]">© 2026 Kurio. Propriedade digital para todos.</p>
      </div>
    </footer>
  )
}