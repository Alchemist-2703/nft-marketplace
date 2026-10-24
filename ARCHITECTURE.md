# Arquitetura, contratos e decisões

## Visão geral

```
UI (React) ──> TanStack Router (rotas, search params, guardas)
          └──> TanStack Query (cache) ──> Axios (/api/*) ──> MSW (handlers REST)
          └──> socket.io-client ───────────────────────────> MSW (ws.link + protocolo Socket.IO)
```

Os componentes, hooks e o cliente Axios **não contêm respostas fictícias**: todo o "backend" vive em `src/mocks`, na camada de rede. O mesmo estado alimenta REST e eventos.

## Contratos REST

Erros seguem `{ code, message, fieldErrors? }` com os códigos `VALIDATION_ERROR`, `UNAUTHORIZED`, `SESSION_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `AVAILABILITY_CONFLICT`, `IDEMPOTENCY_CONFLICT` e `TRANSIENT_ERROR`.

| Recurso | Operação | Endpoint |
|---|---|---|
| Sessão | cadastro / login | `POST /api/auth/register`, `POST /api/auth/login` → `{ token, session }` |
| | sessão / logout | `GET /api/auth/session`, `POST /api/auth/logout` |
| NFTs | listagem | `GET /api/nfts?q&category&minPrice&maxPrice&sort&page&pageSize` → `Paginated<Nft>` |
| | detalhe | `GET /api/nfts/:id` |
| Favoritos | consulta / inclusão / remoção | `GET /api/favorites`, `PUT|DELETE /api/favorites/:nftId` |
| Carrinho | consulta | `GET /api/cart` |
| | inclusão / alteração / remoção | `POST /api/cart/items`, `PATCH|DELETE /api/cart/items/:editionId` |
| | junção do visitante | `POST /api/cart/merge` |
| Cotação | cupom, disponibilidade, taxa, total | `POST /api/quote` `{ couponCode?, network? }` → `Quote` |
| Pedidos | criação idempotente | `POST /api/orders` + cabeçalho `Idempotency-Key` |
| | estado e recibo | `GET /api/orders/:id` |
| Perfil | dados / avatar | `PATCH /api/profile` |
| | senha | `POST /api/profile/password` |
| Carteiras | consulta / cadastro / edição | `GET /api/wallets`, `POST /api/wallets`, `PATCH /api/wallets/:id` |
| | conexão simulada | `POST /api/wallets/:id/connect`, `DELETE /api/wallets/:id/connection` |

Convenções:

- **ETH sempre em string decimal** (`"0.016"`). Os cálculos usam `decimal.js`. Quantidades são inteiros.
- **Cotação como referência do pedido:** `Quote.id` é uma impressão digital das linhas, preços, disponibilidade, cupom, rede e total. O pedido só é criado se o `quoteId` enviado ainda for o atual; caso contrário, `409 AVAILABILITY_CONFLICT`.
- **Idempotência:** a chave fica ligada ao conteúdo do pedido. Mesma chave + mesmo conteúdo devolve o **mesmo pedido** (`200`); mesma chave + conteúdo diferente responde `409 IDEMPOTENCY_CONFLICT`.
- **Recibo:** o pedido guarda um snapshot (itens, preços, taxas, total). Mudanças posteriores no catálogo não o alteram.

## Eventos Socket.IO

| Evento | Payload | Efeito no cliente |
|---|---|---|
| `nft.updated` | `{ eventId, resource: "nft", resourceId, version, editionId, priceEth, available }` | Atualiza listagem, detalhe e relacionados; invalida cotação e carrinho; avisa o usuário se o item está no carrinho ou foi visitado |
| `order.updated` | `{ eventId, resource: "order", resourceId, version, order }` | Atualiza o pedido em cache; em estado terminal, invalida carrinho/catálogo e avisa |

Cliente → servidor: `session.subscribe { token }` e `session.unsubscribe`.

**Idempotência de eventos** (`features/realtime/guard.ts` e `apply-events.ts`):

- `eventId` já visto é descartado (duplicata);
- por recurso, só é aplicado se `version` for maior que a última vista **e** maior que a versão da cópia em cache (evento antigo não regride estado mais novo);
- se a versão salta mais de 1, o catálogo é invalidado para reconciliar.

## Sessão

- Token opaco em `localStorage` (`nft.session.token`); senhas nunca são guardadas em claro (o servidor simulado guarda SHA-256 com sal fixo de demonstração).
- `GET /api/auth/session` recupera a sessão após refresh. Rotas privadas (`/checkout`, `/orders/*`, `/profile`, `/wallets`) validam a sessão no `beforeLoad`.
- **Expiração:** um `401` com `SESSION_EXPIRED`/`UNAUTHORIZED` no interceptor do Axios marca a sessão como expirada; em rota privada o usuário vai para `/login?redirect=…&expired=true` e volta ao ponto de origem após entrar. O rascunho do checkout (cupom, carteira, rede) fica em `sessionStorage` e é retomado.
- **Logout / troca de usuário:** limpam o cache do TanStack Query, o rascunho do checkout e as subscriptions do socket (o socket é recriado a cada mudança de sessão).

## Carrinho

- Guardado no servidor simulado, por dono: `user:<id>` ou `guest:<id>` (cabeçalho `X-Guest-Id`).
- Persiste após refresh. Ao autenticar, `POST /api/cart/merge` soma os itens do visitante respeitando a disponibilidade.
- Após um pedido **confirmado**, são removidos apenas os itens e as quantidades comprados.

## Cache (TanStack Query)

| Política | Valor |
|---|---|
| `staleTime` | 30 s |
| `gcTime` | 5 min |
| Retries | até 2 para falhas de rede e 5xx; nenhum para 4xx |
| Cancelamento | `signal` do Query repassado ao Axios (respostas obsoletas são descartadas) |
| Chaves | incluem parâmetros e o dono (`userId` ou `guest`), isolando dados privados |
| Atualização otimista | favoritos, com rollback em caso de erro |
| Segundo plano | `keepPreviousData` na listagem e na cotação (lista esmaecida + "atualizando…") |
| Sincronização | mutations invalidam `cart` e `quote`; eventos aplicam patches no cache |

## Reconciliação REST ↔ Socket.IO

- A UI **nunca** depende só do evento: o REST é a fonte da verdade.
- Ao reconectar, o cliente reenvia `session.subscribe` e invalida `nfts`, `quote`, `cart`, `order`, `favorites` e `wallets`.
- Um pedido pendente é acompanhado por **polling de 1,5 s** e pelo evento `order.updated`; se a conexão cair, o polling e a reconciliação garantem a recuperação sem criar outro pedido. O estado do pedido é resolvido de forma determinística no servidor simulado (`resolveAt`), inclusive após refresh.
- Eventos só são entregues ao socket cujo `session.subscribe` foi validado para o mesmo usuário do pedido.

## Camada de mocks (MSW)

- Ativada por `VITE_ENABLE_MOCKS`; presente no build de demonstração.
- Estado persistido em `localStorage` (`mock-db-v1`) e cenário em `mock-scenario-v2`; `window.__mocks.reset()` restaura o cenário conhecido.
- Um handler `http.all("/api/*")` aplica latência, jitter, fora de ordem e falhas **antes** dos demais, sem tocar neles.
- **Transporte Socket.IO:** somente `websocket` (sem polling), via `ws.link("*/socket.io/")` + `toSocketIo`.
- **Limitações:**
  - o `socket.io-client` é carregado sob demanda, depois do MSW, porque ele captura o `WebSocket` global ao ser importado;
  - o mock envia pings do Engine.IO manualmente (`"2"` a cada 10 s) para evitar *ping timeout*;
  - não há namespaces, salas, ack de eventos nem polling HTTP;
  - o servidor vive no navegador: abas diferentes não compartilham conexões em tempo real, apenas o `localStorage`.

## Interface e acessibilidade

- Skeletons com shimmer e dimensões do conteúdo (catálogo, detalhe, carrinho, pedido); `prefers-reduced-motion` desliga animações.
- Navegação por teclado com foco visível; link "Ir para o conteúdo"; foco movido para `<main>` a cada troca de rota; título por rota.
- Gavetas (menu e filtros) usam `<dialog>` nativo: foco preso, `Esc` fecha e o foco volta ao gatilho.
- Formulários com `label`, `aria-invalid`, `aria-describedby` e mensagens `role="alert"`.
- Estados nunca dependem só de cor (✓, ●/○, texto "Esgotada"); mudanças em tempo real e mutations usam regiões `aria-live`.
- Alvos de toque de 44 px em telas touch.

## Decisões de UX e desvios do Figma

- Login e cadastro são **páginas** com visual de modal (e não sobrepostas ao conteúdo), para suportar URL, retorno ao fluxo e acesso direto.
- Não implementados por estarem fora do escopo ou sem contrato: login social, "esqueci a senha", avaliações em estrelas, compartilhar NFT, abas "Novos lançamentos/Em alta", seção de blog, cards promocionais e itens de conta como Atividade, Ofertas, Downloads e Suporte.
- O seletor de edição usa "Edição Comum/Rara" (com preço e estoque próprios) em vez de "1/1, 1/10, 1/50".
- As imagens dos NFTs são SVGs gerados no mock (sem dependência de rede) em vez dos assets do arquivo.
- Perfil, Carteiras e Confirmação não têm frame mobile no Figma: foram adaptados a partir do desktop.
- Ajuste de acessibilidade: o texto dos botões primários usa o marrom escuro (`#140D0A`) sobre o laranja para garantir contraste.

## Limitações conhecidas

- Dados e "blockchain" são simulados; referências de transação e links do explorador são fictícios.
- O build de produção também usa mocks (exigência da demonstração).
- A fidelidade visual ao Figma ainda pode ser refinada tela a tela.
