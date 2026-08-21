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
- [ ] **`MP_WEBHOOK_SECRET`** — nunca foi definida. Hoje
      `src/app/api/webhooks/mercadopago/route.ts:13` loga um aviso e **pula a validação
      de assinatura**, ou seja, quem descobrir a URL pode forjar uma confirmação de
      pagamento e liberar inscrição sem pagar. Pegar o secret no painel do Mercado Pago
      (Webhooks → sua notificação) e configurar.

---

## 3. Segurança — rotas ainda sem autenticação

O webhook do MatchZy e o `matchzy-config` de partida de campeonato já foram fechados.
Estas quatro continuam abertas. Todas são `GET` e todas dependem de "ninguém adivinhar o
UUID", o que **não é controle de acesso**.

- [ ] **`/api/matches/[id]/status` — ALTA.** Devolve `connect_string` e `password` do
      servidor da partida (`route.ts:63-64`) para qualquer um, sem sessão. Com o UUID da
      partida — que aparece na URL pública do match — dá para entrar no servidor de uma
      partida oficial em andamento. **Corrigir primeiro.** Deve exigir sessão e checar se
      o usuário é jogador de um dos dois times (ou admin).
- [ ] **`/api/chupeteiromestre/[id]/matchzy-config` — MÉDIA.** Monta o config do MatchZy
      de um lobby PUG, que inclui os **SteamID64 de todos os jogadores**. É exatamente o
      mesmo vazamento que já foi corrigido na rota equivalente de campeonato — falta
      aplicar o mesmo `verifyMatchSecret` aqui.
- [ ] **`/api/tournaments/faceit/[id]/subscriptions` — MÉDIA.** Expõe a lista de inscritos.
      Avaliar o que exatamente sai no payload antes de decidir o nível de proteção.
- [ ] **`/api/matches/[id]/vetoes` — BAIXA.** Só devolve o histórico de vetos, que é
      informação pública da partida. Provavelmente pode ficar aberta; registrado para
      não parecer esquecimento.

### Credenciais do Dathost

- [ ] **O Dathost não oferece token de API.** Confirmado testando contra a API real: a
      única autenticação aceita é HTTP Basic com **e-mail e senha da conta**. Ou seja,
      `USERBLUE`/`PASSBLUE` são a senha do painel, e quem tiver essas variáveis tem
      controle total da conta — incluindo apagar servidores. Consequências: não replicar
      essas variáveis em ambientes de teste/preview, e trocar a senha da conta ao menor
      sinal de exposição.

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
