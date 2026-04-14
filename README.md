<div align="center">

# ⚡ BlueStrike

**A plataforma definitiva de campeonatos de Counter-Strike 2 do Brasil.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Visão Geral](#-visão-geral) · [Stack](#-stack) · [Design System](#-design-system) · [Estrutura](#-estrutura-do-projeto) · [Páginas](#-páginas) · [Regras de Negócio](#-regras-de-negócio) · [Regras da Plataforma](#-regras-da-plataforma) · [Como rodar](#-como-rodar)

</div>

---

## 🎯 Visão Geral

O **BlueStrike** nasceu da necessidade de uma plataforma nacional séria, focada exclusivamente em competição de CS2. O cenário brasileiro sempre foi um dos mais fortes do mundo no Counter-Strike, mas nunca teve uma ferramenta à altura — organizada, moderna e com foco na experiência do jogador.

### A ideia central

> *"Qualquer jogador, do iniciante ao profissional, merece uma plataforma onde possa competir com seriedade, fairplay e reconhecimento real."*

O projeto resolve três problemas principais do cenário competitivo nacional:

1. **Fragmentação** — campeonatos espalhados por Discord, planilhas e grupos de WhatsApp sem estrutura
2. **Falta de credibilidade** — sem anti-cheat, sem árbitro, sem registro histórico
3. **Barreira de entrada** — plataformas estrangeiras em inglês, com processos de inscrição confusos

A BlueStrike unifica tudo: inscrição, chaveamento automático, acompanhamento ao vivo, ranking ELO e histórico de partidas — em português, para o jogador brasileiro.

---

## 🚀 Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) | SSR/SSG nativos, performance, SEO |
| Linguagem | TypeScript 5 | Tipagem forte, segurança em runtime |
| Estilização | Tailwind CSS v4 | Design system customizável sem overhead |
| Componentes | Radix UI Primitives | Acessibilidade nativa, sem estilo imposto |
| Variantes | class-variance-authority (CVA) | Variantes de componentes tipadas |
| Ícones | lucide-react | Tree-shakable, consistentes |
| Merge de classes | clsx + tailwind-merge | Sem conflito de classes Tailwind |
| Fontes | Geist Sans + Geist Mono | Tipografia técnica e moderna |
| Auth | NextAuth.js (beta) | Steam OpenID + Google OAuth |

### Por que Next.js App Router?

- **Server Components** permitem buscar dados sem expor lógica ao cliente
- **Route Handlers** servem como API endpoints sem backend separado (fase inicial)
- **SSG** para páginas estáticas (home, ranking) = carregamento instantâneo
- **SSR** para páginas dinâmicas (torneio ao vivo, dashboard)

---

## 🎨 Design System

### Filosofia de Design

O design é **dark-first, minimalista e técnico** — inspirado em terminais, HUDs de jogos e plataformas como FACEIT e HLTV, mas com identidade visual própria. O objetivo é transmitir **credibilidade e agressividade competitiva** ao mesmo tempo que mantém a interface limpa e intuitiva.

Três princípios guiam todas as decisões visuais:
1. **Contraste alto** — o usuário nunca erra onde clicar
2. **Hierarquia clara** — o CTA principal sempre se destaca
3. **Feedback imediato** — cada interação tem resposta visual (hover, active, loading)

---

### Paleta de Cores

Todas as cores são definidas como CSS Custom Properties no `src/app/globals.css` e mapeadas no bloco `@theme` do Tailwind v4.

#### Tokens base

| Token | Valor Hex | Uso |
|---|---|---|
| `--background` | `#0a0a0a` | Fundo da aplicação inteira |
| `--foreground` | `#fafafa` | Texto principal |
| `--card` | `#111111` | Superfície de cards e modais |
| `--card-foreground` | `#fafafa` | Texto sobre cards |
| `--secondary` | `#1a1a1a` | Hover states, fundos secundários |
| `--muted` | `#181818` | Fundos de seções sutis |
| `--muted-foreground` | `#888888` | Texto de suporte, labels, meta info |
| `--border` | `#222222` | Bordas de todos os elementos |
| `--input` | `#222222` | Fundo de inputs |

#### Cores de marca e semânticas

| Token | Valor Hex | Uso |
|---|---|---|
| `--primary` | `#00c8ff` | Cor principal — CTAs, highlights, ELO, links ativos |
| `--primary-foreground` | `#0a0a0a` | Texto sobre botões primários (preto) |
| `--accent` | `#00c8ff` | Alias do primary para componentes Radix |
| `--ring` | `#00c8ff` | Outline de foco (acessibilidade) |
| `--destructive` | `#ef4444` | Erros, exclusões, banimentos |

#### Cores de status (campeonatos)

| Status | Cor | Hex aproximado |
|---|---|---|
| Inscrições Abertas | Verde | `#22c55e` (green-500) |
| Em Andamento | Ciano | `#00c8ff` (primary) |
| Em Breve | Laranja | `#f97316` (orange-500) |
| Finalizado | Cinza | `#6b7280` (gray-500) |
| Ao Vivo | Vermelho | `#ef4444` (red-500) |

#### Cores de ranking (pódio)

| Posição | Cor | Uso |
|---|---|---|
| 1º lugar | `#eab308` (yellow-500) | Coroa + borda + fundo sutil |
| 2º lugar | `#d1d5db` (gray-300) | Medalha + borda |
| 3º lugar | `#f97316` (orange-400) | Medalha + borda |
| Top 8 | `#00c8ff` (primary) | ELO em destaque |

#### Gradientes de marca

```css
/* Texto em gradiente (logo, headlines) */
background: linear-gradient(135deg, #00c8ff, #0080cc);

/* Gradiente de fundo para banners de campeonato */
background: linear-gradient(to bottom right, #083344, #0f172a, #000000);

/* Gradiente de overlay (escurece imagens de banner) */
background: linear-gradient(to top, #0a0a0a, transparent);
```

#### Efeitos especiais

| Classe utilitária | Efeito |
|---|---|
| `.glow` | `box-shadow: 0 0 20px rgba(0,200,255,0.3)` — brilho ciano |
| `.glow-sm` | Versão menor do glow — para ícones |
| `.glow-orange` | `box-shadow: 0 0 20px rgba(249,115,22,0.3)` |
| `.glass` | `backdrop-filter: blur(12px)` + fundo translúcido |
| `.grid-bg` | Grade de linhas ciano sutis no fundo |
| `.text-gradient` | Texto com gradiente ciano |
| `.text-gradient-orange` | Texto com gradiente laranja→vermelho |
| `.card-hover` | `translateY(-2px)` + glow na borda ao hover |

---

### Tipografia

| Fonte | Uso | Família |
|---|---|---|
| **Geist Sans** | Todo o texto da interface | `var(--font-geist-sans)` |
| **Geist Mono** | Valores numéricos, ELO, códigos | `var(--font-geist-mono)` |

**Escala de pesos:**
- `font-medium` (500) — labels, meta informações
- `font-semibold` (600) — texto de destaque, itens de nav
- `font-bold` (700) — títulos de seção, nomes de times
- `font-black` (900) — hero headline, ELO, prêmios, nome da marca

---

### Animações

Todas as animações são definidas como `@keyframes` no `globals.css` e usadas via classes utilitárias:

| Classe | Duração | Uso |
|---|---|---|
| `.animate-float` | 3s infinite | Blobs decorativos no hero |
| `.animate-slide-up` | 0.4s forwards | Entrada de elementos na hero |
| `.animate-fade-in` | 0.3s forwards | Entrada suave de elementos |
| `.animate-pulse-glow` | 2s infinite | Indicadores "ao vivo" |

---

## 📁 Estrutura do Projeto

```
bluestrike/
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout — Header + Footer em todas as páginas
│   │   ├── globals.css               # Design system completo (cores, animações, utilitários)
│   │   ├── page.tsx                  # Home page
│   │   │
│   │   ├── auth/
│   │   │   └── login/
│   │   │       └── page.tsx          # Página de login (Steam + Google)
│   │   │
│   │   ├── tournaments/
│   │   │   ├── page.tsx              # Listagem de campeonatos com filtros
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Detalhe do campeonato (tabs: info, times, regras, bracket)
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Dashboard do jogador autenticado
│   │   │
│   │   ├── ranking/
│   │   │   └── page.tsx              # Ranking global com pódio + tabela
│   │   │
│   │   └── admin/
│   │       └── page.tsx              # Painel administrativo
│   │
│   ├── components/
│   │   ├── ui/                       # Componentes primitivos reutilizáveis
│   │   │   ├── avatar.tsx            # Avatar com Radix UI
│   │   │   ├── badge.tsx             # Badge com variantes de status
│   │   │   ├── button.tsx            # Botão com 7 variantes (default, gradient, orange, etc.)
│   │   │   ├── card.tsx              # Card + CardHeader, CardContent, CardFooter
│   │   │   ├── input.tsx             # Input estilizado
│   │   │   ├── progress.tsx          # Barra de progresso (vagas do torneio)
│   │   │   ├── separator.tsx         # Divisor horizontal/vertical
│   │   │   └── tabs.tsx              # Tabs com Radix UI
│   │   │
│   │   ├── layout/
│   │   │   ├── header.tsx            # Header fixo com nav + menu mobile + user menu
│   │   │   └── footer.tsx            # Footer com links, social e tagline
│   │   │
│   │   ├── home/
│   │   │   ├── hero.tsx              # Seção hero com CTA principal
│   │   │   ├── featured-tournaments.tsx  # Grid de campeonatos em destaque
│   │   │   ├── ranking-preview.tsx   # Top 5 jogadores
│   │   │   └── social-proof.tsx      # Depoimentos + CTA final
│   │   │
│   │   └── tournament/
│   │       └── tournament-card.tsx   # Card de campeonato (variante featured e list)
│   │
│   ├── data/
│   │   └── mock.ts                   # Dados mockados (torneios, jogadores, times, ranking)
│   │
│   ├── lib/
│   │   └── utils.ts                  # cn(), formatDate(), formatCurrency(), getStatusLabel()
│   │
│   └── types/
│       └── index.ts                  # Todos os tipos TypeScript da aplicação
│
├── public/                           # Assets estáticos
├── next.config.ts                    # Configuração do Next.js
├── tsconfig.json                     # Configuração TypeScript
└── package.json
```

---

## 📄 Páginas

### `/` — Home

Página principal focada em conversão. Estrutura em quatro blocos sequenciais:

1. **Hero** — Headline impactante ("Compita. Vença. Domine."), botão CTA, barra de stats globais (jogadores, prêmios, partidas) e trust badges
2. **Featured Tournaments** — Grid 2 colunas com os torneios em destaque + lista dos demais
3. **Ranking Preview** — Top 5 jogadores com ELO, K/D, HS% e variação de posição
4. **Social Proof** — 3 depoimentos de jogadores + banner final de conversão

### `/tournaments` — Listagem de Campeonatos

- Busca por nome/descrição em tempo real
- Filtros de status: Todos · Abertos · Em Andamento · Em Breve · Finalizados
- Toggle de visualização: Grid (cards) ou Lista (compacto)
- Contador de resultados dinâmico

### `/tournaments/[id]` — Detalhe do Campeonato

Rota dinâmica com quatro abas:
- **Informações** — descrição, distribuição de prêmios, datas, formato, tags
- **Times** — lista dos times inscritos + vagas disponíveis visuais
- **Regras** — lista de regras do campeonato + aviso de penalidade
- **Chaveamento** — bracket visual gerado automaticamente (ou mensagem de aguardo)

Sidebar fixa com: contador de vagas + barra de progresso, botão de inscrição contextual (varia por status), e informações rápidas do evento.

### `/auth/login` — Login

- **Steam** como método principal (estilizado com o azul escuro da Valve)
- **Google** como alternativa
- Trust badges de segurança
- Link para Termos de Uso e Política de Privacidade

### `/dashboard` — Dashboard do Jogador

Requer autenticação. Exibe:
- Header de perfil com avatar, nickname, ELO e rank
- 4 KPI cards: ELO · Win Rate · K/D Ratio · HS Rate
- Abas: **Inscrições** (campeonatos + status de check-in) · **Meu Time** (membros, gestão) · **Estatísticas** (kills, mortes, mapas, barras de performance) · **Notificações**
- Sidebar com perfil/badges e card de próxima partida

### `/ranking` — Ranking Global

- Pódio visual para top 3 (com alturas diferentes)
- Tabela completa com: posição, avatar, nickname, K/D, HS%, Win%, ELO e variação
- Indicadores de tendência (↑ verde, ↓ vermelho, — neutro)

### `/admin` — Painel Administrativo

Acesso restrito a administradores. Exibe:
- 4 KPIs: total de jogadores, campeonatos, partidas, prêmios pagos
- Busca global
- Abas: **Campeonatos** (CRUD completo) · **Jogadores** (visualização + banimento) · **Denúncias** (aprovar/ignorar com severidade)

---

## 📐 Regras de Negócio

### Usuários

| Regra | Detalhe |
|---|---|
| **Autenticação obrigatória para competir** | Apenas usuários autenticados (Steam ou Google) podem se inscrever em campeonatos |
| **Um perfil por conta Steam** | A conta Steam é o identificador único — não é possível criar dois perfis com o mesmo SteamID |
| **Nickname obrigatório** | Importado automaticamente do Steam; pode ser editado uma vez por mês |
| **ELO inicial** | Todo jogador começa com 1.000 pontos de ELO |
| **País derivado do perfil Steam** | O país exibido no perfil vem do Steam e não pode ser alterado manualmente |

### Times

| Regra | Detalhe |
|---|---|
| **Tamanho mínimo** | Um time precisa de ao menos 5 jogadores para se inscrever em campeonatos |
| **Tamanho máximo** | 6 jogadores (5 titulares + 1 substituto) |
| **Capitão** | O criador do time é automaticamente o capitão; pode transferir a capitania a qualquer momento |
| **Um time ativo por jogador** | Um jogador só pode ser membro de um único time simultaneamente |
| **Dissolução de time** | O capitão pode dissolver o time a qualquer momento, desde que não haja campeonatos ativos com o time inscrito |

### Campeonatos — Inscrição

| Regra | Detalhe |
|---|---|
| **Inscrição por time** | Apenas times completos (5+ jogadores) podem se inscrever — não há inscrição individual |
| **Prazo de inscrição** | Após a data de encerramento de inscrições, nenhum time pode entrar |
| **Vagas limitadas** | Quando `registeredTeams === maxTeams`, as inscrições são encerradas automaticamente |
| **Cancelamento de inscrição** | Permitido até 24h antes do início do campeonato; após isso, a vaga é perdida sem reembolso |
| **Restrição de rank** | Alguns campeonatos podem exigir rank mínimo ou máximo de ELO — verificado automaticamente no momento da inscrição |

### Campeonatos — Partidas

| Regra | Detalhe |
|---|---|
| **Check-in obrigatório** | Quando configurado, o time deve fazer check-in na janela de 30 minutos antes da partida |
| **No-show** | Time que não fizer check-in dentro da janela perde a partida por W.O. (walkover) |
| **Resultado final** | Apenas administradores e árbitros podem registrar o resultado de uma partida |
| **Disputa de resultado** | Times têm até 15 minutos após o fim da partida para contestar o resultado via suporte |
| **Substituição** | O substituto pode jogar no lugar de qualquer titular, mas deve estar cadastrado antes do início do campeonato |

### ELO e Ranking

| Regra | Detalhe |
|---|---|
| **Atualização pós-partida** | O ELO é atualizado automaticamente após cada partida registrada |
| **Fórmula base** | Sistema inspirado no Elo de xadrez — diferença de ELO entre os times influencia o ganho/perda |
| **Ganho mínimo** | Mesmo vencendo um time muito mais fraco, o time vencedor ganha ao menos +5 pontos |
| **Perda máxima** | Perder para um time muito mais forte limita a perda a -10 pontos por partida |
| **Campeonatos não rankeados** | Campeonatos marcados como "casual" não afetam o ELO |
| **Decaimento de ELO** | Jogadores inativos por mais de 60 dias perdem 5 pontos de ELO por semana |

### Premiações

| Regra | Detalhe |
|---|---|
| **Distribuição definida pelo organizador** | A premiação e sua divisão são definidas ao criar o campeonato e não podem ser alteradas após o início das inscrições |
| **Pagamento somente ao campeão** | Prêmios são pagos apenas após o encerramento oficial do campeonato e confirmação do resultado |
| **Método de pagamento** | PIX como método padrão; o time vencedor deve fornecer chave PIX em até 7 dias após o resultado |
| **Retenção fiscal** | Prêmios acima de R$ 1.903,98 estão sujeitos à retenção de IR conforme legislação brasileira |

---

## 🛡️ Regras da Plataforma

### Conduta e Fairplay

```
1. Respeito mútuo é obrigatório em todas as interações na plataforma.
   Insultos, discurso de ódio ou assédio resultam em banimento imediato.

2. Uso de qualquer software de trapaça (aimbot, wallhack, triggerbot,
   scripts, etc.) resulta em banimento permanente e irrecorrível.

3. Match-fixing (combinar resultados) é proibido e sujeito a banimento
   permanente de todos os envolvidos, incluindo espectadores cúmplices.

4. Account sharing (emprestar conta para outro jogador competir)
   é proibido. A conta pertence exclusivamente ao seu titular Steam.

5. Smurfing (jogar com conta alternativa para escapar do rank) é
   proibido. Múltiplas contas identificadas serão banidas.
```

### Comunicação

```
6. O chat in-game não é monitorado em tempo real, mas denúncias são
   analisadas. Evidências de comportamento tóxico devem ser enviadas
   em formato de screenshot ou vídeo.

7. Discussões públicas sobre resultados ou jogadores em redes sociais
   são livres, desde que não contenham informações falsas ou difamatórias.

8. Contato com árbitros durante a partida deve ser feito exclusivamente
   pelo canal designado no Discord oficial. Contato direto é ignorado.
```

### Integridade das Partidas

```
9.  Pausas são limitadas a 5 minutos por time por mapa, exceto em
    casos de problemas técnicos comprovados.

10. Reconexão: o jogador tem até 5 minutos para reconectar após uma
    queda de conexão. Após esse prazo, o jogo continua sem ele.

11. Reinício de partida (remake): só é concedido se problemas técnicos
    afetarem ambos os times ou se houver falha comprovada de servidor.
    Requer aprovação do árbitro.

12. Mapas: o veto segue o padrão oficial da CS2 competitive pool.
    Nenhum mapa fora do pool ativo é aceito em campeonatos rankeados.
```

### Administração e Penalidades

| Infração | Punição |
|---|---|
| Comportamento tóxico (1ª vez) | Aviso formal + suspensão de 7 dias |
| Comportamento tóxico (reincidência) | Banimento de 30 dias |
| No-show sem justificativa | Perda da partida + suspensão de 14 dias para o time |
| Suspeita de trapaça | Suspensão temporária + investigação |
| Trapaça confirmada | Banimento permanente da conta + Steam ID bloqueado |
| Match-fixing | Banimento permanente + notificação às autoridades competentes |
| Account sharing | Banimento das contas envolvidas por 90 dias |

### Recursos e Apelações

```
- Apelações devem ser submetidas em até 48 horas após a penalidade.
- O processo de apelação leva até 5 dias úteis.
- A decisão do comitê de administração é final e irrecorrível.
- Apelações de banimento permanente podem ser revisadas após 6 meses.
```

### Privacidade e Dados

```
- Apenas o nickname, país e estatísticas públicas do Steam são exibidos.
- E-mail e dados pessoais nunca são exibidos publicamente.
- Dados de jogadores inativos por mais de 2 anos podem ser anonimizados.
- A plataforma não comercializa dados de usuários com terceiros.
```

---

## 🔐 Segurança

| Camada | Implementação |
|---|---|
| **Autenticação** | OAuth 2.0 via Steam OpenID e Google — sem senha armazenada |
| **Sessão** | JWT com rotação automática; httpOnly cookies |
| **Proteção de rotas** | Middleware Next.js valida sessão antes de renderizar rotas protegidas |
| **CSRF** | Tokens CSRF em todas as mutações de estado |
| **XSS** | React escapa todo output por padrão; nenhuma inserção de HTML cru |
| **SQL Injection** | Queries parametrizadas via ORM (Prisma) — nenhuma concatenação de string |
| **Rate limiting** | Limite de requisições por IP nas rotas de API (a implementar com Upstash) |
| **Validação** | Zod no servidor para validar todos os inputs antes de persistir |
| **Sanitização** | DOMPurify em qualquer campo que aceite texto livre exibido para outros usuários |

---

## 🗺️ Roadmap

### ✅ Fase 1 — Frontend (atual)
- [x] Design system completo (Tailwind v4 + Radix UI)
- [x] Página Home com hero, campeonatos e ranking
- [x] Listagem e detalhe de campeonatos
- [x] Dashboard do jogador
- [x] Ranking global com pódio
- [x] Painel administrativo
- [x] Layout de autenticação

### 🔄 Fase 2 — Backend e Auth
- [ ] NextAuth.js com Steam OpenID Provider
- [ ] NextAuth.js com Google OAuth Provider
- [ ] Banco de dados PostgreSQL + Prisma ORM
- [ ] API Routes para CRUD de campeonatos, times e inscrições
- [ ] Middleware de proteção de rotas autenticadas
- [ ] Sistema de sessão segura com JWT

### 📋 Fase 3 — Funcionalidades Core
- [ ] Bracket automático (single e double elimination)
- [ ] Sistema de check-in com countdown
- [ ] Registro e validação de resultados de partidas
- [ ] Cálculo de ELO em tempo real
- [ ] Sistema de notificações (push + in-app)

### 🚀 Fase 4 — Integrações
- [ ] Steam Web API — importar stats reais (K/D, HS%, mapas)
- [ ] Discord Webhook — notificações de partidas no servidor
- [ ] Sistema de chat entre membros do mesmo time
- [ ] Histórico de partidas com replay de stats
- [ ] Badges e conquistas automáticas

### ⚡ Fase 5 — Escala
- [ ] Rate limiting com Upstash Redis
- [ ] CDN para assets de times e avatares
- [ ] WebSockets para resultados ao vivo
- [ ] Sistema de matchmaking automático
- [ ] App mobile (React Native ou PWA)

---

## 🧑‍💻 Como Rodar

### Pré-requisitos

- Node.js 20+
- npm 10+
- Git

### Instalação

```bash
# Clone o repositório
git clone https://github.com/LosChupeteiros/bluestrike.git
cd bluestrike

# Instale as dependências
npm install

# Rode o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Scripts disponíveis

```bash
npm run dev      # Servidor de desenvolvimento com Turbopack
npm run build    # Build de produção
npm run start    # Serve o build de produção
npm run lint     # ESLint em todos os arquivos
```

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# NextAuth
NEXTAUTH_SECRET=seu_secret_aqui
NEXTAUTH_URL=http://localhost:3000

# Steam OAuth
STEAM_API_KEY=sua_chave_da_api_steam

# Google OAuth
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret

# Banco de dados (Fase 2)
DATABASE_URL=postgresql://user:password@localhost:5432/bluestrike
```

---

## 🌿 Estratégia de Branches

```
main          ← produção estável, deploy automático
  └── dev     ← integração, base para pull requests
        └── feature/xxx   ← novas funcionalidades
        └── fix/xxx       ← correções de bugs
        └── chore/xxx     ← configs, dependências, docs
```

**Fluxo de trabalho:**
1. Crie sua branch a partir de `dev`
2. Abra um Pull Request para `dev`
3. Após revisão e aprovação, merge em `dev`
4. Releases periódicas de `dev` → `main` via PR

---

## 📜 Licença

MIT © [LosChupeteiros](https://github.com/LosChupeteiros) — veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<div align="center">

Feito com 💙 para a comunidade de CS2 brasileira

**[LosChupeteiros](https://github.com/LosChupeteiros)** · BlueStrike Esports

</div>

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
