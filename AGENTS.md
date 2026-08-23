<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Exemplo concreto disso nesta base: `middleware.ts` foi renomeado para
`proxy.ts` no Next 16. O arquivo aqui é `src/proxy.ts` e exporta `proxy()`.

---

# Segurança — leitura obrigatória antes de mexer no backend

Esta plataforma movimenta dinheiro (inscrições via PIX), decide resultado de
campeonato e guarda dado pessoal sob LGPD. O documento completo é
[`docs/SEGURANCA.md`](docs/SEGURANCA.md) — **leia antes de criar ou alterar
qualquer rota em `src/app/api/`, qualquer função em `src/lib/` que leia do banco,
ou qualquer integração com Dathost, MatchZy ou Mercado Pago.**

Front puro (estilo, layout, animação, componente sem fetch novo) não precisa.

## A regra de uma frase

> Nenhuma rota entrega ou altera dado sem antes responder, em código, **quem está
> pedindo** e **se essa pessoa pode**.

## Checklist antes de dar uma rota por pronta

1. **Quem pode chamar?** Anônimo, qualquer logado, dono do recurso, admin, ou
   máquina com segredo? "Qualquer logado" para algo que muda estado quase sempre
   está errado — login é grátis via Steam.
2. **Onde está a checagem?** Dentro do handler ou da lib. O prefixo `/api/admin/`
   **não protege nada**, e o cliente não ter botão também não.
3. **O que sai na resposta?** Algum campo é credencial (senha de servidor, IP,
   token) ou dado pessoal (CPF, telefone, e-mail, nascimento, chave PIX)? Então
   é condicionado a quem pediu — esconder no componente React não conta.
4. **Falha aberta ou fechada?** Segredo ausente ou API externa fora do ar tem que
   **negar**. Dois dos bugs mais graves desta base foram fail-open.
5. **Lista vazia significa o quê?** Se "não veio na lista" vira "foi removido",
   uma falha de rede vira exclusão em massa. Já aconteceu aqui, com inscrições
   pagas.
6. **É idempotente?** Webhook e retry chamam duas vezes.

## Use o que já existe

| Precisa de | Use |
|---|---|
| Sessão | `getCurrentProfile()`, `getSession()` |
| "É jogador desta partida ou admin?" | `resolveMatchViewerAccess()` — `src/lib/matches.ts` |
| Autenticar servidor de jogo | `verifyMatchSecret()`, `verifyIntegrationToken()` — `src/lib/api-auth.ts` |
| Comparar segredo | `secretsMatch()` — **nunca `===`** |
| Esconder dado pessoal | `toPublicProfile()` — `src/lib/profile.ts` |
| Limitar requisições | `rateLimit()` — `src/lib/rate-limit.ts` |

## Postura esperada

Ao mexer em backend, sem precisar ser pedido: responda o checklist antes de
escrever; **avise se encontrar vulnerabilidade em código fora da tarefa** (avise,
não conserte por conta própria); e prove o que afirmar — "adicionei
autenticação" sem mostrar o 401/403 não vale. Não invente que testou.

## LGPD

CPF, telefone, e-mail, data de nascimento e chave PIX nunca saem para terceiro.
Cuidado específico do Next: props de Server Component viram payload RSC visível
no HTML. Passar o objeto de perfil inteiro vaza mesmo que a tela não mostre —
passe o campo derivado (ex.: idade), não o dado bruto.

## Pendências

Antes de propor mudança grande, confira [`PENDENCIAS.md`](PENDENCIAS.md): pode já
estar mapeado ali.
