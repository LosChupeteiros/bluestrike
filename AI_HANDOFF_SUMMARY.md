# BlueStrike Handoff Summary

Este documento resume o trabalho feito neste chat para dar contexto completo a outro agente de código.

## Objetivo Geral

Foram ajustados fluxos centrais da plataforma BlueStrike para campeonatos de CS2:

- Integração de estatísticas MatchZy vindas do MySQL para Supabase.
- Scoreboard de partida com avatares, MVP e links de perfil.
- Controle de polling MatchZy/live para reduzir volume de requests.
- Encerramento correto de servidor Dathost ao fim da partida.
- Bracket com final BO3, disputa de 3º lugar e avanço correto por `round`.
- Página de partida adaptada para BO3, vetos/picks e escolha de lados.
- Aba de perfil com últimas partidas paginadas.
- Fluxo de inscrição paga BlueStrike com MercadoPago PIX real.
- Pódio final mais bonito na aba Informações e Times.

## MatchZy, Stats e Scoreboard

### Problema original

O botão/admin “Atualizar stats” funcionava localmente, mas na Vercel falhava com:

`Stats MySQL não disponíveis após retries para matchzy_match_id ...`

O erro vinha de uma implementação que tentava acessar caminhos/ideias ligados ao phpMyAdmin/local, em vez de consultar o MySQL da mesma forma que a aba Skins já fazia.

### Resultado implementado

- A consulta das tabelas MatchZy passou a seguir o padrão de conexão MySQL já usado pela aba Skins.
- Foram consideradas as tabelas:
  - `matchzy_stats_matches`
  - `matchzy_stats_maps`
  - `matchzy_stats_players`
- Os dados são persistidos no Supabase em `matchzy_player_stats`.
- O scoreboard da página da partida usa esses dados para exibir placar, stats por jogador e destaque de MVP.

### Scoreboard

O scoreboard foi ajustado para:

- Mostrar avatares vindos de `profiles.steam_avatar_url`, cruzando `profiles.steam_id` com `matchzy_player_stats.steamid64`.
- Manter os nomes dos times com casing original, sem `lower()`.
- Destacar MVP em azul.
- Tornar a linha inteira do jogador clicável quando houver perfil.
- Linkar para `/profile/{profiles.public_id}`.
- Remover sublinhado do nick.
- Aplicar hover visual na linha toda.

### Perfil do player

Foi conferido/ajustado para que partidas finalizadas continuem aparecendo na aba de últimas partidas do perfil, com link para a página da partida.

Depois, a aba de últimas partidas foi paginada para evitar lista infinita.

## Polling MatchZy, Dathost e Logs

### Regras finais do polling

O polling MatchZy/live foi ajustado para não começar cedo demais e não rodar agressivamente desde o início.

Regras finais:

- O polling começa somente depois que o comando `matchzy_loadmatch_url` é enviado para o console do servidor Dathost.
- Após isso, o polling roda a cada 1 minuto.
- Quando qualquer time chegar a score `>= 11` no payload `matchzy::live`, o polling baixa para 10 segundos.
- A regra `>= 11` foi mantida para cobrir casos em que o tick falha ou chega atrasado.

Exemplo de payload usado:

```json
{
  "maps": [
    {
      "t1": 11,
      "t2": 8,
      "winner": "",
      "mapname": "de_overpass",
      "finished": false
    }
  ],
  "matchzyMatchId": 1778005991
}
```

### Logs Dathost

A tabela `dathost_api_logs` estava acumulando muitos registros de polling.

Foi ajustado para:

- Manter apenas os últimos status úteis do polling, em vez de acumular indefinidamente.
- Limpar logs da partida após encerramento/deleção do servidor.
- Ao fim da partida, a ordem correta é:
  1. Stop server.
  2. Delete server.
  3. Limpar `dathost_api_logs` para `match_id` da partida.

### Status da partida

Quando a partida fica live, a tag no topo da página da partida muda de “Iniciando” para “Live”.

Ao finalizar, o placar passou a usar a fonte correta/final, evitando o caso em que a vitória piscava primeiro para um time e depois para outro.

## Bracket, 3º Lugar e Final BO3

### Regra corrigida

Foi removida a lógica errada baseada em `match_index === 1` para detectar disputa de 3º lugar.

O `match_index` voltou a ser apenas a posição dentro da rodada.

A classificação especial agora usa `round`:

- Para torneios com 4+ times:
  - Semifinais ficam em `semifinalRound`.
  - Disputa de 3º lugar fica em `thirdPlaceRound`.
  - Final fica em `finalRound`.
- Para torneios com 2 times:
  - A única partida é a final.

### Helper central

Foi usado/criado um helper central de modelo da bracket, com campos como:

- `baseRounds`
- `semifinalRound`
- `thirdPlaceRound`
- `finalRound`
- `hasThirdPlace`

As detecções passaram a ser:

- 3º lugar: `match.round === thirdPlaceRound`
- Final: `match.round === finalRound`

### Geração e correção da bracket

Regras finais:

- A final nasce automaticamente como BO3/MD3.
- A disputa de 3º lugar é BO1/MD1.
- A disputa de 3º lugar fica dentro da bracket, entre as duas semifinais e a final.
- Vencedores das semifinais vão para a final.
- Perdedores das semifinais vão para a disputa de 3º lugar.
- O campeonato só fecha como `finished` quando a final terminou e, se existir, a disputa de 3º lugar também terminou.
- O botão admin “Corrigir Bracket” foi preparado para reparar dados desalinhados e recriar/reclassificar final e 3º lugar conforme `round`.

### Ranking/Times

Na aba Times do campeonato:

- 1º lugar = vencedor da final.
- 2º lugar = perdedor da final.
- 3º lugar = vencedor da disputa de 3º lugar.

## Página de Partida, BO3, Vetos e Lados

### Final BO3

A página da partida foi adaptada para suportar final MD3/BO3.

Comportamento esperado:

- A final mostra badge BO3.
- A config MatchZy gera `num_maps: 3`.
- O scoreboard suporta múltiplos mapas.
- A UI permite alternar/listar placares dos mapas para trocar o scoreboard exibido.

### Vetos BO3

A sequência final de veto BO3 ficou:

`veto veto pick pick veto veto sobra`

Importante:

- O último mapa não é um pick manual.
- Ele é o mapa restante, salvo automaticamente.
- Na UI, a palavra “escolher” foi trocada por “pick” quando o contexto for selecionar mapa.

### Escolha de lado

Foi adicionado fluxo para capitães escolherem lado nos mapas pickados pelo adversário:

- Se `team1` picka um mapa, `team2` escolhe lado.
- Se `team2` picka um mapa, `team1` escolhe lado.
- Mapa que sobra usa faca/knife.

Exemplo de `map_sides` esperado na config MatchZy:

```json
{
  "map_sides": ["team1_ct", "team2_ct", "knife"]
}
```

Também foram usados os assets:

- `assets/sides/Tr_logo.webp`
- `assets/sides/Ct_logo.webp`

Esses logos substituem renders antigos de CT/TR também na aba Skins.

## Inscrição Paga BlueStrike com MercadoPago

### Problema original

O fluxo BlueStrike tinha um PIX fake:

- Abria modal fake.
- O usuário clicava “Já paguei”.
- A inscrição era criada direto em `tournament_registrations`.

Isso foi substituído por fluxo real inspirado no FACEIT.

### Regra final

Para campeonatos BlueStrike pagos:

- O time só entra em `tournament_registrations` após pagamento aprovado pelo MercadoPago.
- Antes disso, existe apenas uma intenção/reserva de inscrição.
- PIX pendente reserva a vaga por 15 minutos.
- Se o usuário fechar o modal, pode retomar o pagamento pelo botão.

### Migration criada

Arquivo:

`supabase/migrations/20260505_bluestrike_registration_intents.sql`

Tabela:

`public.tournament_registration_intents`

Campos principais:

- `id`
- `tournament_id`
- `team_id`
- `captain_profile_id`
- `status`
- `payment_status`
- `payment_amount`
- `payment_method`
- `mp_payment_id`
- `payment_reference`
- `pix_qr_code`
- `pix_qr_code_base64`
- `pix_expires_at`
- `expires_at`
- `paid_at`
- timestamps

Índices principais:

- Por campeonato/status/expiração.
- Por capitão/campeonato.
- Unique parcial para impedir reserva aberta duplicada por `(tournament_id, team_id)` quando `status in ('pending', 'paid')`.
- Unique para `payment_reference`.
- Unique parcial para `mp_payment_id`.

### Biblioteca de intent

Arquivo principal:

`src/lib/tournament-registration-intents.ts`

Responsabilidades:

- Criar intent para o capitão atual.
- Expirar intents antigas.
- Contar reservas ativas.
- Buscar intent atual.
- Salvar dados do PIX.
- Finalizar intent paga.
- Inserir em `tournament_registrations` de forma idempotente.
- Usar external reference prefixado:

```ts
bluestrike:{intentId}
```

### Rotas adicionadas

Foram adicionadas rotas em:

- `src/app/api/tournaments/[id]/registration-intent/route.ts`
- `src/app/api/tournaments/[id]/pix-payment/route.ts`
- `src/app/api/tournaments/[id]/payment/route.ts`
- `src/app/api/tournaments/[id]/registration-status/route.ts`

Fluxo:

1. Criar intent após aceitar termos.
2. Gerar PIX MercadoPago.
3. Salvar QR code/copia e cola na intent.
4. Polling verifica pagamento enquanto modal está aberto.
5. Webhook confirma pagamento.
6. A intent paga cria a inscrição real em `tournament_registrations`.

### MercadoPago

Arquivo:

`src/lib/mercadopago.ts`

Foi ajustado para `createPixPayment` aceitar:

- `externalReference`
- `expirationMinutes`

Isso permitiu usar `bluestrike:{intentId}` sem quebrar o fluxo FACEIT existente.

### Webhook MercadoPago

Arquivo:

`src/app/api/webhooks/mercadopago/route.ts`

Comportamento:

- Se `external_reference` começa com `bluestrike:`, finaliza intent BlueStrike.
- Caso contrário, mantém compatibilidade com o fluxo FACEIT antigo baseado no registration id cru.

### UI da inscrição

Arquivo:

`src/app/tournaments/[id]/tournament-registration-card.tsx`

O card agora tem:

- Confirmação de time BlueStrike.
- Avatares dos titulares.
- Termos de participação.
- Resumo de pagamento.
- Sugestão de divisão por jogador.
- PIX MercadoPago com QR Code e copia e cola.
- Estado de PIX pendente.
- Botão para retomar pagamento.
- Estado visual de pagamento aprovado.

Para campeonatos gratuitos, o fluxo ainda confirma inscrição diretamente, sem PIX.

## Pódio Final

### Objetivo

Na aba Informações, quando o campeonato está finalizado, o pódio deve aparecer no topo acima de “Sobre o campeonato”.

Também deve seguir o visual da aba Times e exibir prêmio em reais.

### Componente

Arquivo:

`src/app/tournaments/[id]/tournament-podium.tsx`

Foi criado um componente compartilhado para a aba Informações e a aba Times.

Layout final:

- Desktop: 2º | 1º | 3º.
- Mobile: cards empilhados.
- Cada colocação fica em um card moderno.
- Ordem visual dentro do card:
  1. Time.
  2. Valor do prêmio.
  3. Medalha.
  4. Posição.

Medalhas usadas:

- 🥇 `1 lugar`
- 🥈 `2 lugar`
- 🥉 `3 lugar`

As medalhas foram colocadas em área própria com altura estável para não serem cortadas pelo card.

### Integração

Arquivo:

`src/app/tournaments/[id]/tournament-detail-page-view.tsx`

Foi ajustado para:

- Calcular pódio por resultados reais da bracket.
- Usar o componente `TournamentPodium`.
- Mostrar pódio final na aba Informações quando o campeonato está finalizado.
- Mostrar o mesmo pódio na aba Times.
- Considerar reservas pendentes na contagem visual de vagas.

## Validações Realizadas

Durante o trabalho, foram rodadas validações relevantes:

```bash
npx tsc --noEmit --pretty false
```

O TypeScript passou.

Também foram rodados ESLint focados nos arquivos alterados, por exemplo:

```bash
npx eslint src/app/tournaments/[id]/tournament-podium.tsx
```

Os arquivos alterados validados passaram.

Há avisos/erros de lint antigos em áreas não relacionadas quando se roda `npx eslint` no projeto inteiro. Eles não fazem parte desta entrega.

## Arquivos-Chave Mexidos ou Criados

### MatchZy / partida / bracket

Os principais pontos trabalhados no chat envolveram:

- `src/app/api/matches/[id]/matchzy-config/route.ts`
- `src/app/tournaments/[id]/matches/[matchId]/match-page-client.tsx`
- `src/lib/match-flow.ts`
- `src/lib/maps.ts`
- `src/lib/bracket-model.ts`
- rotas relacionadas a side selection em `src/app/api/matches/[id]/side/`
- migração `supabase/migrations/20260505_matchzy_player_stats.sql`

### BlueStrike registration/payment/podium

- `supabase/migrations/20260505_bluestrike_registration_intents.sql`
- `src/lib/tournament-registration-intents.ts`
- `src/lib/mercadopago.ts`
- `src/lib/tournaments.ts`
- `src/app/api/webhooks/mercadopago/route.ts`
- `src/app/api/tournaments/[id]/registration-intent/route.ts`
- `src/app/api/tournaments/[id]/pix-payment/route.ts`
- `src/app/api/tournaments/[id]/payment/route.ts`
- `src/app/api/tournaments/[id]/registration-status/route.ts`
- `src/app/tournaments/[id]/tournament-registration-card.tsx`
- `src/app/tournaments/[id]/tournament-detail-page-view.tsx`
- `src/app/tournaments/[id]/tournament-podium.tsx`

## Regras Importantes Para Manter

- Não usar `match_index` para detectar final ou 3º lugar.
- Usar `round` e o helper de bracket para final/3º lugar.
- Final BlueStrike deve ser BO3/MD3.
- Disputa de 3º lugar deve ser BO1/MD1.
- BO3 veto sequence: `veto veto pick pick veto veto sobra`.
- Último mapa do BO3 é sobra automática, não pick manual.
- Capitão escolhe lado no mapa pickado pelo adversário.
- Mapa que sobra usa knife.
- Polling MatchZy só começa depois do `matchzy_loadmatch_url`.
- Polling normal: 1 minuto.
- Polling acelerado: 10 segundos quando algum score `>= 11`.
- Ao fim da partida: stop server, delete server, limpar logs Dathost da partida.
- BlueStrike pago só cria `tournament_registrations` depois do pagamento aprovado.
- PIX pendente reserva vaga por 15 minutos.
- Webhook MercadoPago precisa manter compatibilidade FACEIT e suportar `bluestrike:{intentId}`.

