# Pendências — BlueStrike

Registro vivo do que ficou em aberto. Cada item diz **o que falta**, **por que importa** e
**como resolver**. Ao concluir, marque `[x]` e deixe a linha no histórico — não apague.

Última revisão: 21/08/2026

---

## 1. Jurídico / societário

Os documentos legais (`src/lib/legal.ts`, publicados em `/terms` e `/privacy`) já estão
escritos, mas contêm marcadores que **precisam de dados reais antes de qualquer cobrança
em produção**. Um Termo de Uso sem qualificação da empresa é frágil se for questionado.

- [ ] **CNPJ, razão social e endereço** — `src/lib/legal.ts`, objeto `BLUESTRIKE_ENTITY`.
      Hoje: `[Razão social — preencher]`, `[CNPJ — preencher]`, `[Endereço completo — preencher]`.
      Aparecem no cabeçalho dos dois documentos e na cláusula de foro.
- [ ] **Encarregado de dados (DPO)** — campo `dpoName`. A LGPD (art. 41) exige que o
      controlador indique um encarregado e divulgue publicamente a identidade dele.
      Pode ser o próprio sócio no começo, mas precisa de nome.
- [ ] **Comarca do foro** — campo `jurisdiction`, usado na cláusula final do Termo.
      Deve ser a comarca da sede da empresa.
- [ ] **Caixas de e-mail reais** — os documentos prometem `contato@bluestrike.com.br` e
      `privacidade@bluestrike.com.br`. O segundo é o canal de exercício de direitos do
      titular (LGPD art. 18) e tem prazo de resposta. Se a caixa não existe, a promessa
      é inexequível. Criar as duas antes de publicar.
- [ ] **Revisão por advogado** — o texto foi redigido com cuidado, mas duas cláusulas
      merecem olhar profissional: (a) política de reembolso de inscrição frente ao
      direito de arrependimento do CDC (art. 49); (b) limitação de responsabilidade,
      que o CDC restringe em relação de consumo.
- [ ] **Idade mínima e menores** — hoje o cadastro pede data de nascimento mas não há
      fluxo de consentimento parental. Se aceitar menor de 18, a LGPD (art. 14) exige
      consentimento específico de um responsável. Decidir: barrar menores ou implementar.

---

## 2. Configuração de ambiente (Vercel)

Sem essas variáveis, código que já está escrito não funciona ou falha aberto.

- [ ] **`SERVER_INTEGRATION_TOKEN`** — token que autentica o MatchZy no nosso webhook.
      Sem ele, `verifyIntegrationToken` devolve **503 e recusa tudo** (falha fechado,
      de propósito). Definir na Vercel em Production e Preview e **redeployar** —
      variável nova só entra em build novo.
- [ ] **Rotacionar esse token** — o valor gerado durante os testes foi colado no chat.
      Depois de confirmar que o fluxo funciona ponta a ponta, gerar outro e substituir.
      Comando: `openssl rand -hex 32`.
- [ ] **`NEXT_PUBLIC_SITE_URL=https://www.bluestrike.com.br`** — precisa ser o host
      **canônico, com `www`**. `bluestrike.com.br` responde 307 para o `www`, e o
      `HttpClient` do .NET (que é o que o MatchZy usa) **descarta o header
      `Authorization` em redirect entre hosts diferentes**. Sem isso, a autenticação
      quebra em silêncio: o servidor recebe 401 e a partida não carrega.
      Existe fallback no código (`getIntegrationBaseUrl`), mas depender de fallback é ruim.
- [ ] 🚨 **`MP_WEBHOOK_SECRET` — BLOQUEIA O DEPLOY.** A rota passou a **falhar
      fechada**: antes, sem a variável, ela pulava a validação de assinatura e seguia;
      agora devolve 401. Isso é o comportamento correto, mas significa que
      **enquanto a variável não estiver na Vercel, nenhum pagamento é confirmado**.
      Pegar em Mercado Pago → Suas integrações → Webhooks → Assinatura secreta, e
      configurar **antes** de publicar esta branch.

- [ ] **`WEAPONPAINTS_MYSQL_SSL=insecure` na Vercel.** A verificação de certificado
      TLS do MySQL passou a ser ligada por padrão. O servidor do Dathost
      (`burn.dathost.net`) apresenta certificado que não valida — testado, o handshake
      falha com `HANDSHAKE_SSL_ERROR`. Sem essa variável, o placar ao vivo para de
      funcionar. É opt-out consciente e temporário: ver o item de MITM na seção 3.

---

## 3. Segurança — rotas ainda sem autenticação

O webhook do MatchZy, o `matchzy-config` de partida de campeonato e o `status` já foram
fechados. Estas continuam abertas. Todas são `GET` e todas dependem de "ninguém adivinhar
o UUID", o que **não é controle de acesso**.

- [x] ~~**`/api/matches/[id]/status` — ALTA.**~~ **Resolvido.** Devolvia `connect_string` e
      `password` do servidor para qualquer um, sem sessão — com o UUID da partida, que
      aparece na URL pública, dava para entrar num servidor oficial em andamento. Agora
      IP, porta, senha e connect string só saem para jogador de um dos dois times ou
      admin, via `resolveMatchViewerAccess()` (`src/lib/matches.ts`). O mesmo helper passou
      a ser usado pela página da partida, para as duas regras não divergirem de novo — era
      justamente essa duplicação que deixava a página escondendo a senha do espectador
      enquanto a rota de polling continuava mandando. `status`, `ready` e placar seguem
      públicos, senão a página para de atualizar para quem só assiste.
- [x] ~~**`/api/chupeteiromestre/[id]/matchzy-config`**~~ **Resolvido.** Entregava o
      SteamID64 de todos os jogadores do lobby PUG. Agora exige segredo por lobby
      (`pug_lobbies.webhook_secret`, migration `20260824_pug_webhook_secret`), entregue
      ao servidor no `matchzy_loadmatch_url` de 3 argumentos. Junto veio o
      `matchzy_match_id` do PUG, que ainda usava `Date.now()/1000` e era adivinhável.
- [x] ~~**`/api/tournaments/faceit/[id]/subscriptions`**~~ **Reavaliado.** O payload em
      si é público (times inscritos num campeonato). O problema real era outro e mais
      grave — ver o cancelamento em massa logo abaixo.
- [ ] **`/api/matches/[id]/vetoes` — BAIXA.** Só devolve o histórico de vetos, que é
      informação pública da partida. Decidido deixar aberta; registrado para não parecer
      esquecimento.

### Riscos que permanecem

- [ ] **MITM no MySQL que decide o campeonato.** O certificado de
      `burn.dathost.net` não valida, então a conexão roda com
      `WEAPONPAINTS_MYSQL_SSL=insecure`: cifrada, mas sem autenticar a ponta. Esse banco
      é a fonte da verdade de placar, vencedor e ELO — quem se puser no meio decide quem
      ganhou. **Abrir chamado no Dathost** pedindo certificado válido, ou obter a CA
      deles e fixá-la (`ssl: { ca }`). Enquanto isso não acontece, é o furo aberto mais
      relevante da plataforma.

- [ ] **Rate limiting é por instância.** `src/lib/rate-limit.ts` conta em memória, e a
      Vercel roda várias instâncias — o teto real é `limite × instâncias`. Serve para
      cortar automação burra e enumeração; não serve contra atacante distribuído.
      Migrar para contador central (Upstash Redis) quando houver volume.

- [ ] **Validação de entrada desigual.** Zod é usado em 2 das 59 rotas e nas server
      actions; o resto valida à mão. Não é vulnerabilidade conhecida hoje, mas é o tipo
      de inconsistência onde a próxima aparece. Padronizar aos poucos, começando pelas
      rotas que escrevem no banco.

- [ ] **O Dathost não oferece token de API.** Confirmado testando contra a API real: a
      única autenticação aceita é HTTP Basic com **e-mail e senha da conta**. Ou seja,
      `USERBLUE`/`PASSBLUE` são a senha do painel, e quem tiver essas variáveis tem
      controle total da conta — incluindo apagar servidores. Consequências: não replicar
      essas variáveis em ambientes de teste/preview, e trocar a senha da conta ao menor
      sinal de exposição.

### Corrigido na auditoria de 21/08/2026

Detalhamento completo em [`docs/SEGURANCA.md`](docs/SEGURANCA.md).

- [x] **Cancelamento em massa de inscrições pagas.** `getFaceitChampionshipSubscriptions`
      devolvia `[]` em qualquer erro, e quem consumia lia isso como "todo mundo
      cancelou" — um 429 da FACEIT cancelava todas as inscrições pagas do campeonato.
      Disparava **sozinho**, sem atacante. Agora `fetchFaceitChampionshipSubscriptions`
      distingue falha de vazio, e `syncCancellations` nunca age com lista vazia.
- [x] **`reload-stats` finalizava partida alheia.** Qualquer conta logada encerrava
      qualquer partida — no placar parcial, avançando o chaveamento e mexendo no ELO.
      Agora exige jogador ou admin, e estado terminal.
- [x] **`matchzy-tick` aberto a qualquer conta logada.** Mesmo tratamento.
- [x] **Webhook do Mercado Pago devolvia 200 no `catch`.** O MP lia como entregue e
      nunca reenviava: jogador pagava, banco falhava, inscrição não saía. Agora devolve
      500 para o MP repetir.
- [x] **Open redirect no `?next=` do login.** `sanitizeNextPath` barrava `//` mas não
      `\`, tab, CR nem LF — cinco vetores levavam a `https://evil.com`. Agora resolve
      contra origem base e exige mesma origem.
- [x] **Sem rate limiting e sem cabeçalhos de segurança.** Criado `src/proxy.ts`
      (no Next 16 o `middleware.ts` virou `proxy.ts`).

---

## 4. Validações que só dá para fazer depois do deploy

- [ ] **Loop completo de autenticação.** A cadeia `matchzy_loadmatch_url` → nossa rota de
      config → `matchzy_remote_log_url` → nosso webhook só pode ser testada com o site
      publicado, porque o servidor de jogo precisa alcançar a URL pública. Já foi
      verificado isoladamente que o MatchZy **aceita e parseia** a forma de 3 argumentos
      do `matchzy_loadmatch_url` (url + nome do header + valor) — o log do servidor
      confirmou `headerName: Authorization`. Falta o teste ponta a ponta.
- [ ] **Nenhum webhook real do MatchZy chegou ainda.** A tabela `matchzy_webhook_events`
      está vazia (os três registros de teste que eu criei foram removidos). Isso significa
      que a integração de webhook **nunca foi exercitada em partida de verdade**. Ao subir
      a próxima partida, conferir se chega evento; se não chegar, investigar se as cvars
      `matchzy_remote_log_*` precisam estar no `.cfg` base do servidor em vez de serem
      enviadas por console.

---

## 5. Débito técnico

- [ ] **`src/app/teams/create/create-team-form.tsx` é código morto.** A página
      `src/app/teams/create/page.tsx:4` importa `create-team-form-client`, não esse
      arquivo. O arquivo órfão ainda usa `alert()` para erro. Deletar.
- [ ] **Commit `a2586b3` tem mensagem incorreta.** A mensagem afirma ter alterado os IDs
      dos servidores espelho (`MIRROR_SERVER_IDS` em `src/lib/match-flow.ts`), mas o
      `git diff` mostra que o arquivo não foi tocado — os IDs corretos, que já
      funcionavam, permaneceram intactos. Nada quebrou; a mensagem é que está errada.
      Já corrigido por comentário no PR #27. Registrado aqui para quem for ler o
      histórico no futuro não se confundir.
- [ ] **`teams.wins` / `teams.losses`.** Passaram a ser mantidos por `syncTeamRecord()`
      (`src/lib/teams.ts`), que **recalcula** a partir das partidas finalizadas em vez de
      incrementar — então é idempotente e se auto-corrige. O histórico antigo já foi
      preenchido via SQL. Sem ação pendente; anotado porque é fácil alguém "otimizar"
      isso de volta para um incremento e reintroduzir o bug.

---

## Como usar este arquivo

Item novo entra na seção que combina, com o mesmo formato: o que falta, por que importa,
como resolver. Vale a pena registrar até o que parece óbvio hoje — daqui a três meses
não vai ser.
