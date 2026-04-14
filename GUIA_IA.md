# GUIA_IA - BlueStrike

## Objetivo

Este arquivo e o meu guia permanente para manter coerencia quando eu for criar ou alterar paginas, componentes e funcionalidades no BlueStrike.

Se houver conflito entre uma ideia "bonita" e a identidade do produto, a identidade do BlueStrike vence.

Regra principal: NUNCA deixar com cara de IA.

## Fontes analisadas

- `README.md`
- `AGENTS.md`
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `postcss.config.mjs`
- `src/app/*`
- `src/components/*`
- `src/data/mock.ts`
- `src/lib/utils.ts`
- `src/lib/profile.ts`
- `src/lib/profiles.ts`
- `src/lib/auth/*`
- `src/app/profile/*`
- `src/app/api/auth/*`
- `src/app/api/profile/route.ts`
- `src/types/index.ts`
- Docs locais do Next 16 em:
- `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`

## Observacao importante sobre o README

O `README.md` tem duas camadas:

- A parte importante e correta e a proposta detalhada do BlueStrike, com produto, design system, paginas e regras de negocio.
- No fim ainda existe resto do boilerplate padrao do `create-next-app`. Aquela parte NAO define a identidade do produto e deve ser ignorada como referencia de UX, conteudo ou arquitetura.

## Essencia do produto

BlueStrike nao e um SaaS generico com skin gamer.

BlueStrike e um hub brasileiro de campeonatos de CS2 com foco em:

- seriedade competitiva
- credibilidade
- fairplay
- clareza operacional
- sensacao de arena / painel tatico / HUD premium
- onboarding simples para jogadores brasileiros

O produto quer resolver:

- fragmentacao de campeonatos
- falta de credibilidade
- barreira de entrada

Tudo que eu criar deve reforcar que esta e uma plataforma confiavel para competir, nao apenas "uma landing page bonita".

## DNA visual

Palavras-chave visuais:

- dark-first
- tecnico
- minimalista
- competitivo
- agressivo com controle
- premium sem luxo exagerado
- esports brasileiro com credibilidade

Referencias de sensacao:

- HUD de jogo
- painel de campeonato
- operacao de evento competitivo
- mistura de FACEIT/HLTV com identidade propria

O BlueStrike NAO deve parecer:

- template de startup
- dashboard generico
- "cyberpunk" exagerado
- neon aleatorio
- portfolio experimental
- mockup cheio de blobs sem funcao
- layout com excesso de vidro, brilho e gradiente so para parecer moderno

## Paleta e hierarquia de cor

Cores base atuais em `src/app/globals.css`:

- fundo principal: `#0a0a0a`
- texto principal: `#fafafa`
- card: `#111111`
- secundaria: `#1a1a1a`
- muted: `#181818`
- borda/input: `#222222`
- primaria da marca: `#00c8ff`
- destrutiva: `#ef4444`

Uso correto das cores:

- ciano e a cor de autoridade da marca: CTA principal, foco, destaque, links ativos, ELO, estados importantes
- amarelo/ouro e reservado para premio, podio, conquista, campeao
- verde e reservado para sucesso, inscricao aberta, check-in, confirmacao
- laranja e reservado para "em breve", aquecimento, energia secundaria
- vermelho e reservado para alerta, ao vivo, erro, banimento, lotado
- roxo existe hoje como acento pontual, mas NAO e identidade principal da marca

## Tipografia

Tipografia atual:

- `Geist Sans` para interface
- `Geist Mono` para numeros, ELO, estatisticas e leitura tecnica

Padroes que devo preservar:

- headlines com `font-black`
- subtitulos com `font-bold` ou `font-semibold`
- meta info com `text-xs` ou `text-sm` em `muted-foreground`
- numeros importantes com alto contraste e peso alto

## Efeitos visuais

Efeitos existentes que fazem parte da linguagem:

- `grid-bg`
- `text-gradient`
- `glow`
- `card-hover`
- fundos com gradiente ciano -> azul -> preto
- blobs desfocados de baixa opacidade

Regras de uso:

- efeitos sempre como suporte, nunca como protagonista
- fundo pode ter grid, glow e blur, mas o conteudo precisa continuar legivel e dominante
- brilho deve destacar poucos pontos importantes
- animacao deve ser curta e util

Animacoes aceitas:

- entrada suave
- leve slide-up
- pulse para "ao vivo" ou notificacao
- float apenas em elementos decorativos muito discretos

Animacoes a evitar:

- movimentos longos e chamativos
- elementos flutuando por toda a tela
- parallax gratuito
- animacao em tudo ao mesmo tempo

## Composicao de pagina

Padroes estruturais fortes da base atual:

- `Header` fixo no topo
- paginas com `pt-20` ou `pt-24` para compensar header
- containers em `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- secoes com muito uso de `py-24`
- cards com `rounded-xl` ou `rounded-2xl`
- borda sempre presente e sutil
- blocos bem segmentados por cards, tabs, tabelas e sidebars

Assinaturas de composicao que devo repetir:

- etiqueta superior com icone + label em ciano
- titulo forte
- subtitulo curto em muted
- area principal com alto contraste
- CTA principal claro
- informacao secundaria em cards/tabelas/listas

## Linguagem de interface

O texto do produto deve ser:

- em PT-BR
- direto
- confiante
- competitivo
- profissional
- sem hype vazio

Tom correto:

- "Compita, venca e domine"
- "Inscreva seu time"
- "Premiacao total"
- "Check-in obrigatorio"
- "Ranking global"

Tom errado:

- frases vagas tipo "leve sua experiencia ao proximo nivel"
- texto publicitario genrico de startup
- jargoes de IA
- copy floreada demais

## Guardrails anti-cara-de-IA

Estas regras sao obrigatorias:

- nao gerar layouts genricos que poderiam servir para qualquer startup
- nao usar hero vazio com muito gradiente e pouco conteudo real
- nao exagerar em efeitos "futuristas" sem funcao
- nao usar ilustracoes aleatorias ou stock visual sem contexto competitivo
- nao lotar a pagina de cards identicos sem ritmo visual
- nao usar roxo como base da marca
- nao inventar numeros, badges, rankings ou depoimentos novos sem coerencia com o dominio
- nao escrever headlines abstratas demais
- nao transformar tudo em glassmorphism
- nao criar paginas "limpinhas demais" a ponto de perder densidade competitiva

O BlueStrike precisa parecer produto real de campeonato:

- informacao concreta
- estados claros
- dados, vagas, horarios, premios, ranking, times
- hierarquia forte
- CTA evidente

## Linguagem e UX

Regras fixas para qualquer interface nova:

- escrever em PT-BR de verdade, com acentuacao correta
- tratar a experiencia como produto lider, nao como mock de estudo
- evitar repeticao visual e cards redundantes
- cada card precisa justificar sua existencia com dado util para o jogador
- priorizar clareza, leitura rapida e hierarquia competitiva
- toda decisao de UI deve partir da visao do usuario, nao da conveniencia tecnica

## Regras fixas de perfil

Quando eu mexer em perfil de jogador, estas regras sao obrigatorias:

- seguir a base visual do dashboard existente, especialmente o topo com avatar + nome + KPIs
- rota publica sempre em `/profile/[id]`, usando ID numerico publico do banco
- `/profile` serve apenas como redirecionador para o proprio usuario autenticado
- formulario de cadastro e edicao nunca ficam abertos por padrao no perfil publico
- CPF, celular e data de nascimento sao privados; entram apenas no modo de edicao do proprio jogador
- bio e funcao aparecem publicamente, mas so podem ser alteradas ao clicar em editar
- nivel Steam nao entra no topo do perfil nem no header global; ele so pode aparecer no card "Conta conectada"
- ELO deve ser tratado como atributo central da identidade competitiva do jogador
- seletor de funcao precisa usar card/hover no padrao dos cards de campeonatos, nunca select feio ou bloco generico

## Componentes base que devo reutilizar

Componentes UI existentes:

- `Button`
- `Badge`
- `Card`
- `Input`
- `Tabs`
- `Avatar`
- `Progress`
- `Separator`

Uso esperado:

- `Button variant="gradient"` para CTA principal
- `Button variant="outline"` para acao secundaria
- `Button variant="ghost"` para acoes leves
- `Button variant="orange"` apenas quando a pagina pedir energia/warning secundaria
- `Badge` para status, severidade, premio, papel
- `Tabs` para dividir conteudo denso sem criar paginas confusas
- `Progress` para vagas, performance e acompanhamento
- `Avatar` para jogadores e perfis

## Padrao das paginas existentes

`/`

- Home de conversao
- hero de alto impacto
- estatisticas
- campeonatos em destaque
- ranking preview
- prova social
- CTA final

`/tournaments`

- pagina de descoberta
- busca
- filtro por status
- toggle grid/lista

`/tournaments/[id]`

- pagina de detalhe
- hero/banner tecnico
- breadcrumb
- tabs de conteudo
- sidebar sticky com vagas e CTA

`/auth/login`

- card central
- foco total na autenticacao
- Steam como metodo principal
- cadastro obrigatorio so depois do login

`/dashboard`

- area do jogador
- kpis
- tabs
- sidebar lateral

`/profile/[id]`

- deve herdar a linguagem do dashboard do jogador
- header com avatar, nome, ELO e status
- barra de KPI curta logo abaixo
- grid principal com conteudo + sidebar
- edicao aparece so quando o proprio dono clica em "Editar perfil"
- informacao publica: nome, idade, bio, funcao, ELO, status e link da Steam
- informacao sensivel nunca aparece no modo publico
- "Conta conectada" fica em card separado e e a unica area onde nivel Steam pode aparecer

`/ranking`

- podio visual
- tabela completa
- comparacao objetiva

`/admin`

- painel operacional
- kpis
- busca
- tabs
- tabelas e lista de moderacao

## Estrutura tecnica atual

Arquitetura atual:

- Next.js 16 com App Router
- codigo em `src/`
- layout raiz em `src/app/layout.tsx`
- estilos globais em `src/app/globals.css`
- dados mockados centralizados em `src/data/mock.ts`
- tipos centralizados em `src/types/index.ts`
- utilitarios em `src/lib/utils.ts`
- componentes compartilhados em `src/components`

Observacoes de implementacao:

- paginas e layouts sao Server Components por padrao no Next 16
- `params` em rotas dinamicas estao sendo usados como `Promise`, alinhado ao doc local do Next 16
- `globals.css` deve continuar sendo realmente global; estilizar componentes principalmente com Tailwind
- `use client` deve ser usado so onde houver estado, evento ou API de browser

Regra para o futuro:

- nao expandir o client-side sem necessidade
- preferir ilhas interativas pequenas em vez de transformar paginas inteiras em client component

## Estrutura de rotas e organizacao

Hoje a estrutura e simples e direta. Isso e bom.

Se o projeto crescer, posso usar recursos do Next 16 que ja revisei:

- route groups para separar grandes areas sem mudar URL
- pastas privadas como `_components` e `_lib` quando uma rota ficar grande
- layouts aninhados quando uma secao pedir shell propria

Mas por enquanto devo preservar a clareza da base atual e evitar complexidade antecipada.

## Regras de negocio que precisam permanecer visiveis

Ao criar funcionalidades novas, lembrar sempre das regras de dominio do README:

- autenticacao obrigatoria para competir
- inscricao por time, nao individual
- time com pelo menos 5 jogadores
- check-in pode ser obrigatorio
- ELO e ranking sao parte central da plataforma
- premiacao e importante e deve aparecer com clareza
- fairplay, anti-cheat, arbitragem e penalidades fazem parte da proposta

O produto nao e so "matchmaking" nem so "conteudo". Ele gira em torno de campeonato, confianca e reconhecimento.

## Estado atual real da base

Hoje o projeto esta forte em frontend mockado e identidade visual, mas agora ja existe um primeiro bloco real de auth/perfil com Steam + Supabase.

Pontos reais do estado atual:

- a maior parte da interface usa `mock.ts`
- login com Steam e sessao por cookie ja existem
- perfil do jogador ja persiste no Supabase
- rota publica de perfil usa `/profile/[id]` com `public_id` numerico
- dashboard e admin ainda sao mockados
- ainda nao ha backend completo para campeonatos, ranking e administracao
- alguns links apontam para paginas ainda inexistentes
- os banners de torneio citados no mock nao existem em `public/`
- `public/` ainda tem assets padrao do scaffold do Next, que nao fazem parte da marca

Links atualmente apontando para rotas nao implementadas:

- `/about`
- `/contact`
- `/blog`
- `/terms`
- `/privacy`
- `/rules`
- `/dashboard/profile`
- `/dashboard/settings`
- `/players/[id]`

Isso significa:

- ao criar novas paginas, devo tratar essas lacunas como parte do roadmap real
- nao devo assumir que qualquer link atual ja representa uma secao consolidada

## Saude tecnica atual

Estado validado agora:

- `npm run lint` passando limpo
- `npm run build` passando

Diretriz para o futuro:

- manter esse baseline limpo
- se eu tocar em auth, perfil ou header, devo validar lint e build antes de fechar

## Heuristicas para novas paginas

Antes de desenhar qualquer nova tela, eu devo responder:

- qual fluxo real do campeonato essa pagina resolve?
- qual e o CTA principal?
- qual dado competitivo precisa estar em destaque?
- qual estado operacional o usuario precisa entender rapido?
- essa tela reforca credibilidade ou parece apenas decoracao?

Checklist de execucao:

- manter shell global com `Header` + `Footer`
- usar o container padrao
- repetir etiqueta superior com icone + titulo + subtitulo
- usar cards com borda sutil e fundo escuro
- usar ciano para destaque e nao para tudo
- usar ouro para premio/podio
- priorizar informacao real antes de decoracao
- deixar CTA principal obvio
- manter consistencia com `Button`, `Badge`, `Tabs`, `Progress`, `Avatar`
- adicionar metadata quando fizer sentido
- respeitar convencoes do Next 16 antes de mudar estrutura

## O que fazer quando eu tiver duvida

Se eu estiver em duvida entre duas direcoes:

- escolher a mais clara
- escolher a mais util para o jogador
- escolher a menos generica
- escolher a que parece mais "plataforma real de campeonato"

Se uma ideia parecer bonita mas nao parecer BlueStrike, eu devo descartar.

## Resumo final

BlueStrike e:

- serio
- escuro
- tecnico
- competitivo
- brasileiro
- confiavel
- objetivo

BlueStrike nao e:

- visual de IA
- startup generica
- cyberpunk exagerado
- template com glow aleatorio
- landing page vazia

Toda nova pagina ou funcionalidade deve parecer uma extensao natural do ecossistema de campeonatos ja prometido pelo README e ja sugerido pela interface atual.
