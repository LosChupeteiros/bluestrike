# Segurança — BlueStrike

Este documento tem dois públicos: quem for auditar a plataforma, e quem for
escrever a próxima feature (pessoa ou IA). A segunda metade é a que importa no
dia a dia — ela existe para que uma feature nova não reintroduza um problema já
resolvido.

Última auditoria completa: **21/08/2026**.

---

## Parte 1 — O modelo de ameaça

### O que um atacante quer daqui

Em ordem de dano:

1. **Alterar resultado de partida** — decidir quem venceu, quem subiu no
   chaveamento, quem levou o prêmio.
2. **Entrar num servidor de partida oficial** — trollar, sabotar, espionar.
3. **Inscrever-se sem pagar** ou fazer alguém perder uma inscrição paga.
4. **Vazar dado pessoal** — CPF, telefone, e-mail dos jogadores (LGPD).
5. **Derrubar partida ao vivo** — negação de serviço com prejuízo reputacional.

Note que "roubar o banco" não está no topo. O ativo mais valioso aqui é a
**integridade do resultado competitivo**: é isso que faz a plataforma valer
alguma coisa.

### De onde vem a confiança

Só três fontes são confiáveis. Tudo o mais é entrada hostil.

| Fonte | Como se prova | Onde vive |
|---|---|---|
| Sessão do usuário | JWT assinado com `AUTH_SECRET` | cookie `bluestrike_session` |
| Servidor de jogo | segredo por partida (`matches.webhook_secret`) ou token global (`SERVER_INTEGRATION_TOKEN`) | header `Authorization` |
| Mercado Pago | HMAC do header `x-signature` **mais** consulta do pagamento na API deles | `MP_WEBHOOK_SECRET` |

**Nada além disso é prova de nada.** Em particular:

- Um UUID na URL **não é credencial**. Ver a seção sobre UUID abaixo.
- O prefixo `/api/admin/` **não protege nada**. É só um caminho.
- O corpo de um webhook **não é verdade** — é o que o remetente afirma.
- `is_admin` vem sempre do banco, nunca do token.

### A pergunta sobre UUID

> *"O UUID do usuário e da partida ficam públicos na URL. Isso permite hackear
> alguma coisa?"*

**Não, e não precisa ser escondido — desde que nenhuma rota trate o UUID como
senha.** É exatamente essa a regra que a auditoria foi verificar.

Contexto concreto:

- **Perfil**: a URL usa `public_id` (número curto), não o UUID. O UUID do perfil
  não aparece na URL.
- **Partida**: a URL usa o UUID mesmo. Isso é normal e igual ao que FACEIT e
  Gamers Club fazem.

Um UUIDv4 tem 122 bits de aleatoriedade — ninguém adivinha por força bruta. Mas
esse **não é o argumento de segurança**, porque o UUID não é secreto: ele é
compartilhado em Discord, aparece em print, fica no histórico do navegador. Se
alguma rota der acesso a algo só porque quem chamou sabe o UUID, essa rota está
errada, por mais aleatório que o UUID seja.

O padrão correto, que hoje é o aplicado:

> O UUID diz **qual** recurso. A sessão diz **quem** está pedindo. A rota decide
> cruzando os dois.

Um identificador que **era** exploravel e foi corrigido: o `matchzy_match_id`,
que é um inteiro e vinha de `Date.now()/1000`. Esse dava para adivinhar — sabendo
mais ou menos quando a partida subiu, eram ~21.600 candidatos numa janela de 6h,
varridos em minutos. Hoje é `randomInt` no int32 positivo.

---

## Parte 2 — O que a auditoria de 21/08/2026 encontrou

Método: leitura de todas as 59 rotas de API, classificação do controle de acesso
de cada uma, e prova prática dos achados contra um servidor local.

### Corrigido nesta rodada

| # | Problema | Impacto | Correção |
|---|---|---|---|
| 1 | `GET /api/matches/[id]/status` devolvia `connect_string` e `server_password` sem sessão | qualquer um entrava no servidor de uma partida oficial em andamento | exige jogador da partida ou admin, via `resolveMatchViewerAccess()` |
| 2 | Lista vazia da FACEIT era lida como "todos cancelaram" | **cancelamento em massa de inscrições pagas**, disparado por um 429 — inclusive sozinho, sem atacante | `fetchFaceitChampionshipSubscriptions()` distingue falha de vazio; `syncCancellations()` nunca age com lista vazia |
| 3 | `POST /api/matches/[id]/reload-stats` finalizava qualquer partida para qualquer conta logada | encerrar partida alheia no placar parcial, avançar chave, mexer em ELO; ou marcar partida ao vivo como `processing_failed` | exige jogador ou admin **e** estado terminal (admin pode forçar) |
| 4 | `POST /api/admin/matches/[id]/matchzy-tick` aberto a qualquer conta logada | idem, embora o gatilho venha do MySQL e não do corpo | exige jogador ou admin |
| 5 | `GET /api/chupeteiromestre/[id]/matchzy-config` sem autenticação | SteamID64 de todos os jogadores do lobby | segredo por lobby (`pug_lobbies.webhook_secret`) + `matchzy_loadmatch_url` de 3 argumentos |
| 6 | `matchzy_match_id` do PUG vinha de `Date.now()/1000` | id adivinhável | `generateMatchzyMatchId()` |
| 7 | Webhook do Mercado Pago com `MP_WEBHOOK_SECRET` ausente **passava** | validação de assinatura desligada em produção sem ninguém saber | falha fechada; comparação em tempo constante; janela de 15min contra replay |
| 8 | Webhook do Mercado Pago devolvia **HTTP 200 no `catch`** | jogador paga, banco falha, MP nunca reenvia, inscrição não sai — **perda de dinheiro real** | devolve 500 para o MP repetir |
| 9 | `sanitizeNextPath` bloqueava `//` mas não `\`, tab, CR ou LF | open redirect pós-login → phishing com o domínio do BlueStrike na barra | resolve contra origem base e exige mesma origem |
| 10 | TLS do MySQL com `rejectUnauthorized` desligado por padrão | MITM na conexão que **decide vencedor e ELO** | verificação ligada por padrão; opt-out exige a palavra `insecure` e loga aviso |
| 11 | Nenhum rate limiting em lugar nenhum | força bruta e enumeração à vontade | `proxy.ts` + `src/lib/rate-limit.ts` |
| 12 | Nenhum cabeçalho de segurança | clickjacking, sniffing de MIME, vazamento de referrer | `proxy.ts` |

Os itens 9 e 10 foram provados na prática antes de corrigir:

- **Open redirect**: `/\evil.com`, `/<tab>/evil.com`, `/<lf>//evil.com` e
  `/<cr>\evil.com` resolviam todos para `https://evil.com/`. Cinco vetores, não
  um. A correção zera os cinco.
- **TLS do MySQL**: testado contra `burn.dathost.net` — com
  `rejectUnauthorized: true` o handshake falha (`HANDSHAKE_SSL_ERROR`). O
  certificado do servidor **não valida**. Por isso o opt-out continua ligado hoje
  e virou pendência: a conexão está cifrada, mas sem autenticar a ponta, o que
  não protege contra MITM.

### Já estava correto (verificado, não presumido)

- **Preço calculado no servidor** — `tournament.entryFee` vem do banco; o corpo
  da requisição não influencia valor.
- **Webhook do MP não confia no corpo** — busca o pagamento real via
  `getPaymentById()`. Forjar `{"status":"approved"}` não funciona.
- **Autorização de times** — `deleteTeam` e `updateTeamDescription` conferem
  `captainId` na camada de lib, não só na rota.
- **Draft do PUG** — `pickPlayer` confere capitão **e** vez.
- **SQL parametrizado** em todo lugar.
- **JWT via `jose`**, sem confusão de algoritmo.
- **`is_admin` lido do banco**, então token antigo não escala privilégio.
- **Upload com allowlist** e nome gerado no servidor.
- **`.env` nunca versionado** — confirmado com `git ls-files`.

### Ainda em aberto

Estão rastreados em [`PENDENCIAS.md`](../PENDENCIAS.md). Os que mais importam:

- **Certificado do MySQL do Dathost** — enquanto não validar, `WEAPONPAINTS_MYSQL_SSL=insecure` é necessário e o MITM continua possível.
- **`MP_WEBHOOK_SECRET`** — agora que a rota falha fechada, **sem essa variável nenhum pagamento é confirmado**. Configurar antes de publicar.
- **Rate limiting é por instância** — a Vercel roda várias, então o teto real é `limite × instâncias`. Suficiente para automação burra; para valer de verdade, precisa de um contador central (Upstash/Redis).

---

## Parte 3 — Regras para escrever feature nova

**Esta seção é a que evita a próxima vulnerabilidade.** Vale para pessoa e para
IA (Claude, Codex, o que for). Toda feature que toca backend passa por aqui.

### A regra de uma frase

> Nenhuma rota entrega ou altera dado sem antes responder, em código,
> **quem está pedindo** e **se essa pessoa pode**.

### Checklist obrigatório para rota nova em `src/app/api/`

Antes de considerar a rota pronta, responda por escrito no PR:

1. **Quem pode chamar?** Anônimo, qualquer logado, dono do recurso, admin, ou
   máquina com segredo? Se a resposta for "qualquer logado" para algo que muda
   estado, provavelmente está errada — login é grátis via Steam.

2. **Onde está a checagem?** Tem que estar **dentro do handler ou da função de
   lib**. Não vale confiar em:
   - prefixo de URL (`/api/admin/...` não protege nada),
   - o cliente não ter botão para aquilo,
   - o UUID ser difícil de adivinhar.

3. **O que sai no corpo da resposta?** Liste os campos. Algum é credencial
   (senha, IP de servidor, token) ou dado pessoal (CPF, telefone, e-mail,
   nascimento)? Se sim, tem que ser condicionado a quem pediu — não escondido no
   componente React.

4. **Se falhar, falha aberta ou fechada?** Segredo ausente, API externa fora do
   ar, resposta vazia: o caminho de erro **tem que negar**, não liberar. Dois
   bugs graves desta plataforma foram exatamente isto (itens 2 e 7 acima).

5. **Lista vazia significa o quê?** Se o código trata "não veio na lista" como
   "foi removido", uma falha de rede vira exclusão em massa. Distinga
   explicitamente "consultei e está vazio" de "não consegui consultar".

6. **É idempotente?** Webhook e retry vão chamar duas vezes. Rodar de novo pode
   dar prêmio dobrado ou avançar o chaveamento duas vezes?

### Padrões prontos — use, não reinvente

| Precisa de | Use | Arquivo |
|---|---|---|
| Sessão do usuário | `getCurrentProfile()` / `getSession()` | `src/lib/profiles.ts`, `src/lib/auth/session.ts` |
| "É jogador desta partida ou admin?" | `resolveMatchViewerAccess(matchId)` | `src/lib/matches.ts` |
| Autenticar servidor de jogo (por partida) | `verifyMatchSecret(req, secret)` | `src/lib/api-auth.ts` |
| Autenticar servidor de jogo (global) | `verifyIntegrationToken(req)` | `src/lib/api-auth.ts` |
| Comparar segredo | `secretsMatch()` — nunca `===` | `src/lib/api-auth.ts` |
| Gerar id/segredo de partida | `generateMatchzyMatchId()`, `generateMatchSecret()` | `src/lib/api-auth.ts` |
| URL entregue ao servidor de jogo | `getIntegrationBaseUrl()` | `src/lib/api-auth.ts` |
| Esconder dado pessoal de terceiro | `toPublicProfile()` | `src/lib/profile.ts` |
| Limitar requisições | `rateLimit()` | `src/lib/rate-limit.ts` |

### Erros específicos desta base — não repita

- **Esconder no componente não é controle de acesso.** A página da partida
  escondia a senha do servidor de espectador, mas a rota de polling mandava para
  todo mundo. Quem esconde é o servidor, na resposta.

- **Lógica de autorização duplicada diverge.** Foi assim que o bug acima nasceu:
  a página e a rota tinham cada uma a sua cópia da regra. Extraia para uma função
  e use nos dois lugares.

- **`catch` que devolve 200 mente para o remetente.** Se você não processou,
  responda erro — senão o Mercado Pago (ou qualquer webhook) nunca reenvia.

- **`.replace()` silencioso não avisa quando não casa.** Ao editar código por
  script, verifique se a substituição realmente aconteceu. Um commit desta base
  afirma ter mudado IDs de servidor e não mudou nada.

- **Rota sob `/admin` sem checagem de admin.** Já aconteceu duas vezes aqui.

### Quando a feature envolve dado pessoal (LGPD)

CPF, telefone, e-mail, data de nascimento e chave PIX **nunca** saem para
terceiro. Em Next.js, props de Server Component viram payload RSC visível no
HTML — passar o objeto inteiro para o componente vaza mesmo que a tela não
mostre. Passe o campo derivado (ex.: idade), não o dado bruto.

### Postura esperada da IA que gerar código aqui

Ao implementar qualquer coisa que toque backend, sem precisar ser pedido:

1. Responda o checklist acima antes de escrever a rota.
2. Se encontrar uma vulnerabilidade **em código que não faz parte da tarefa**,
   avise. Não conserte por conta própria sem falar — mas não fique calado.
3. Prove o que afirmar. "Adicionei autenticação" sem teste não vale; rode a
   requisição sem credencial e mostre o 401/403.
4. Não invente que testou.

Front puro (estilo, layout, animação, componente sem fetch novo) não precisa
desse ritual.
