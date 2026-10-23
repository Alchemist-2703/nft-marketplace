# NFT Marketplace — Desafio Frontend

Marketplace de NFTs em **React + TypeScript**, com API, autenticação, carteiras, pagamentos e eventos em tempo real **simulados** (MSW). Os fluxos de descoberta, compra e conta do colecionador funcionam em desktop e mobile.

> Decisões de arquitetura, contratos e limitações: veja [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Stack

| Responsabilidade | Tecnologia |
|---|---|
| Interface | React 19 + TypeScript (Vite) |
| Roteamento | TanStack Router |
| Estado remoto | TanStack Query |
| Cliente HTTP | Axios |
| Tempo real | Socket.IO (`socket.io-client`) |
| Estilos / componentes | Tailwind CSS 4 + shadcn/ui |
| Mocking | MSW 2 + `@mswjs/socket.io-binding` |
| Testes E2E / visual | Playwright (Chromium) |
| Auditoria | Lighthouse |

## Requisitos

- Node.js **22 ou superior** (testado com Node 24)
- npm

## Setup

```bash
npm install
npx playwright install chromium   # só para rodar os testes E2E
npm run dev                       # http://localhost:5173 (com mocks)
```

## Variáveis de ambiente

| Variável | Onde | Valor | Efeito |
|---|---|---|---|
| `VITE_ENABLE_MOCKS` | `.env.development`, `.env.production` | `true` / `false` | Liga a camada MSW (REST + Socket.IO). **No build de demonstração é `true`.** |
| `VITE_MOCK_SCENARIO` | opcional | nome de um cenário | Cenário inicial, aplicado apenas na primeira carga (veja a tabela abaixo). |

## Credenciais fictícias

| Usuário | E-mail | Senha |
|---|---|---|
| Ana Colecionadora | `ana@kurio.dev` | `Senha@123` |
| Bruno Artista | `bruno@kurio.dev` | `Senha@456` |

Cupons: `WELCOME10` (10% de desconto) e `EXPIRED10` (expirado). Qualquer outro código é inválido.

## Cenários e reset

O servidor simulado é **reproduzível**: a latência variável usa uma semente fixa e os contadores reiniciam a cada troca de cenário.

Como escolher um cenário:

1. **Painel visual:** abra `/?mocks=1` e use o botão **Cenários** (canto inferior direito). `?mocks=0` oculta o painel.
2. **URL:** `/?scenario=<nome>` (aplicado ao carregar).
3. **Console:** `window.__mocks.useScenario("<nome>")`.

| Cenário | O que simula |
|---|---|
| `default` | Tudo funciona, latência de 300 ms |
| `empty` | Catálogo sem resultados |
| `slow` | Respostas em 2,5 s (skeletons com shimmer) |
| `variable-latency` | Latência variável reproduzível |
| `out-of-order` | Respostas fora de ordem na listagem |
| `offline` | Erro de conexão no catálogo |
| `server-error` | HTTP 500 no catálogo |
| `flaky` | Falha 3 vezes e recupera com "Tentar novamente" |
| `payment-declined` | Pedidos terminam recusados |
| `order-timeout` | A próxima compra cria o pedido, mas a resposta demora 12 s (recuperação por idempotência) |
| `wallet-refused` | Carteira recusa a conexão (403) |
| `favorites-fail` | Favoritar falha (testa o rollback) |
| `socket-down` | Tempo real indisponível |

Eventos manuais (painel ou console, `window.__mocks`):

- `bumpCartPrice(10)` — sobe o preço do primeiro item do carrinho e emite `nft.updated`
- `soldOutCartItem()` — esgota a edição do primeiro item do carrinho
- `realtime.replayLastEvent()` / `realtime.emitStaleEvent()` — evento duplicado / antigo
- `realtime.dropConnections()` — derruba as conexões Socket.IO
- `expireSession()` — expira todas as sessões no servidor simulado
- `reset()` — apaga todo o estado local e recarrega (volta ao cenário conhecido)

### Reproduzir os fluxos de falha

| Fluxo | Como reproduzir |
|---|---|
| Sessão expirada no checkout | Entre, vá ao `/checkout`, rode `window.__mocks.expireSession()` e clique em "Conectar" numa carteira |
| Preço alterado na compra | No carrinho/revisão, rode `window.__mocks.bumpCartPrice(10)` |
| Edição esgotada | `window.__mocks.soldOutCartItem()` |
| Timeout com recuperação | `/?scenario=order-timeout`, confirme a compra, depois confirme de novo |
| Pagamento recusado | `/?scenario=payment-declined` |
| Cupom inválido/expirado | Use `XYZ` ou `EXPIRED10` no carrinho |
| Conflito de cadastro | Cadastre com `ana@kurio.dev` |
| Acesso não autorizado | Abra `/checkout` sem estar logado |

## Comandos

| Comando | Descrição |
|---|---|
| `npm run dev` | Desenvolvimento com mocks |
| `npm run build` | Verifica tipos e gera o build (com mocks, via `.env.production`) |
| `npm run preview` | Serve o build (use `-- --port 4173 --strictPort` para o Lighthouse) |
| `npm run typecheck` | Verificação de tipos |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Testes Playwright (desktop e mobile) |
| `npm run test:e2e:update` | Gera/atualiza as baselines de regressão visual |
| `npm run lighthouse` | Auditoria Lighthouse (precisa do preview rodando) |

## Testes (Playwright)

```bash
npm run test:e2e:update   # primeira vez: cria as baselines visuais
npm run test:e2e          # roda tudo
npx playwright show-report
```

- Cada teste usa um contexto de navegador isolado (storage limpo).
- Os testes de REST passam pelos handlers MSW; os de tempo real passam pelo cliente `socket.io-client`.
- Relatório HTML em `playwright-report/` e traces das falhas em `test-results/`.
- Projetos: `desktop` (1440×900) e `mobile` (390×844). Larguras 390/768/1440 são verificadas em `responsive.spec.ts`.

## Lighthouse

```bash
npm run build
npm run preview -- --port 4173 --strictPort    # terminal 1
npm run lighthouse                              # terminal 2
```

Gera `lighthouse/reports/*.html|json` (3 medições por página e perfil) e `lighthouse/summary.md` com a **mediana** de cada categoria, LCP, CLS e TBT, além das versões e do ambiente.

### Resultados

> Preencha com o conteúdo de `lighthouse/summary.md` após rodar a auditoria e justifique qualquer valor abaixo da meta.

## Deploy (Vercel)

1. Suba o repositório no GitHub.
2. Na Vercel: **Add New → Project**, importe o repositório (preset *Vite*; build `npm run build`; saída `dist`).
3. O arquivo `vercel.json` já reescreve todas as rotas para `/index.html` (acesso direto e refresh funcionam).
4. O `.env.production` mantém `VITE_ENABLE_MOCKS=true`, então o build publicado traz os mocks e o tempo real.

URL pública: _preencher_  ·  Repositório: _preencher_

## Estrutura

```
src/
  api/            Axios + chamadas REST tipadas
  components/     UI compartilhada (shadcn/ui, layout, Drawer, FormField)
  features/       auth, catalog, cart, checkout, wallets, profile, realtime, account
  lib/            query-client, store, utils
  mocks/          MSW: db, engine, handlers REST, socket.io, caos, painel
  routes/         páginas
  types/          contratos tipados
e2e/              testes Playwright
scripts/          auditoria Lighthouse
```
