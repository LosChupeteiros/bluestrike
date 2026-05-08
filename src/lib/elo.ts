import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { syncTeamElo } from "@/lib/teams";

function normalizeSteamId(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizePlayerName(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

// K-factor por formato da série — calibrado para ~2 BO3/mês
const K_BY_BO: Record<number, number> = { 1: 300, 3: 500, 5: 700 };

/**
 * Calcula o delta de ELO de um jogador em uma partida.
 *
 * Fórmula: Elo clássico + modificador de K/D + modificador de saldo de rounds.
 *
 * performanceFactor ∈ [-0.4, 0.4]  — baseado no K/D individual da série
 * roundFactor       ∈ [-0.2, 0.2]  — baseado no saldo de rounds do time na série
 *
 * finalDelta = baseDelta + |baseDelta| × (performanceFactor + roundFactor)
 *
 * Efeitos combinados (cap total ±0.6 de |baseDelta|):
 *   - Vencer com bom KD e shutout amplifica o ganho
 *   - Perder com bom KD e rounds apertados suaviza a perda
 *   - Perder com KD ruim e rounds esmagadores amplifica a perda
 */
export function calculateEloDelta(
  playerElo: number,
  opponentTeamAvgElo: number,
  isWinner: boolean,
  seriesKills: number,
  seriesDeaths: number,
  seriesRoundsWon: number,
  seriesRoundsLost: number,
  boType: number
): number {
  const K = K_BY_BO[boType] ?? K_BY_BO[1]!;
  const S = isWinner ? 1 : 0;
  const E = 1 / (1 + Math.pow(10, (opponentTeamAvgElo - playerElo) / 400));

  const baseDelta = K * (S - E);

  const kdRatio = seriesKills / Math.max(seriesDeaths, 1);
  const performanceFactor = Math.max(-0.4, Math.min(0.4, (kdRatio - 1.0) * 0.3));

  const totalRounds = seriesRoundsWon + seriesRoundsLost;
  const roundFactor = totalRounds > 0
    ? Math.max(-0.2, Math.min(0.2, ((seriesRoundsWon - seriesRoundsLost) / totalRounds) * 0.4))
    : 0;

  const finalDelta = baseDelta + Math.abs(baseDelta) * (performanceFactor + roundFactor);
  return Math.round(finalDelta);
}

interface AggregatedPlayerStat {
  steamid64: string;
  kills: number;
  deaths: number;
}

/**
 * Atualiza o ELO de todos os jogadores que participaram de uma partida.
 * Idempotente: se já existir registro em elo_history para esse match + profile, não faz nada.
 *
 * @param matchId UUID da partida finalizada
 * @param hasStats Se false (walkover/resultado manual), não aplica modificadores de performance
 */
export async function updateEloAfterMatch(matchId: string, hasStats: boolean): Promise<void> {
  const supabase = createSupabaseAdminClient();

  // Buscar dados da partida
  const { data: match } = await supabase
    .from("matches")
    .select("id, team1_id, team2_id, winner_id, bo_type")
    .eq("id", matchId)
    .maybeSingle<{ id: string; team1_id: string | null; team2_id: string | null; winner_id: string | null; bo_type: number | null }>();

  if (!match?.team1_id || !match.team2_id || !match.winner_id) {
    console.warn(`[elo] Partida ${matchId} sem times ou vencedor definido — ELO ignorado`);
    return;
  }

  // Idempotência: verificar se já processamos ELO para essa partida
  const { data: existingHistory } = await supabase
    .from("elo_history")
    .select("id")
    .eq("match_id", matchId)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (existingHistory) {
    console.log(`[elo] Partida ${matchId} já tem ELO calculado — ignorando`);
    return;
  }

  const boType = match.bo_type ?? 1;

  // Buscar membros dos dois times com seus ELOs
  const { data: allMembers } = await supabase
    .from("team_members")
    .select("profile_id, team_id")
    .in("team_id", [match.team1_id, match.team2_id])
    .returns<{ profile_id: string; team_id: string }[]>();

  if (!allMembers || allMembers.length === 0) return;

  const allProfileIds = allMembers.map((m) => m.profile_id);

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, elo, steam_id, steam_persona_name")
    .in("id", allProfileIds)
    .returns<{ id: string; elo: number; steam_id: string | null; steam_persona_name: string | null }[]>();

  if (!profileRows || profileRows.length === 0) return;

  const profileById = new Map(profileRows.map((p) => [p.id, p]));

  // Calcular ELO médio por time (entre os membros atuais)
  function avgTeamElo(teamId: string): number {
    const members = allMembers!.filter((m) => m.team_id === teamId);
    if (members.length === 0) return 1000;
    const total = members.reduce((sum, m) => sum + (profileById.get(m.profile_id)?.elo ?? 1000), 0);
    return Math.round(total / members.length);
  }

  const avgEloTeam1 = avgTeamElo(match.team1_id);
  const avgEloTeam2 = avgTeamElo(match.team2_id);

  // Buscar stats agregados da partida (soma kills/deaths por jogador; rounds por mapa deduplicados)
  // Indexa por steamid64 e também por player_name (lowercased) para fallback quando o
  // steamid64 vier corrompido por arredondamento de BIGINT no MySQL do MatchZy.
  const statsBySteamId = new Map<string, AggregatedPlayerStat>();
  const statsByName = new Map<string, AggregatedPlayerStat>();
  let seriesRoundsTeam1 = 0;
  let seriesRoundsTeam2 = 0;

  if (hasStats) {
    const { data: statRows } = await supabase
      .from("matchzy_player_stats")
      .select("steamid64, player_name, kills, deaths, mapnumber, map_team1_score, map_team2_score")
      .eq("match_id", matchId)
      .returns<{ steamid64: string; player_name: string | null; kills: number; deaths: number; mapnumber: number; map_team1_score: number | null; map_team2_score: number | null }[]>();

    if (statRows && statRows.length > 0) {
      const seenMaps = new Set<number>();
      for (const row of statRows) {
        const steamKey = normalizeSteamId(row.steamid64);
        const nameKey = normalizePlayerName(row.player_name);

        // Kills/deaths somados por jogador em todos os mapas
        const existingBySteam = steamKey ? statsBySteamId.get(steamKey) : undefined;
        if (existingBySteam) {
          existingBySteam.kills += row.kills ?? 0;
          existingBySteam.deaths += row.deaths ?? 0;
        } else if (steamKey) {
          statsBySteamId.set(steamKey, { steamid64: steamKey, kills: row.kills ?? 0, deaths: row.deaths ?? 0 });
        }

        // Indexa também por nome (mesma referência por jogador)
        if (nameKey) {
          const existingByName = statsByName.get(nameKey);
          if (existingByName) {
            // Já contabilizado via steamid64 acima — só agrega se ainda não houver row por steam.
            if (!existingBySteam) {
              existingByName.kills += row.kills ?? 0;
              existingByName.deaths += row.deaths ?? 0;
            }
          } else {
            statsByName.set(nameKey, steamKey ? statsBySteamId.get(steamKey)! : { steamid64: steamKey, kills: row.kills ?? 0, deaths: row.deaths ?? 0 });
          }
        }

        // Rounds somados uma vez por mapa (qualquer jogador representa o mapa)
        if (!seenMaps.has(row.mapnumber)) {
          seenMaps.add(row.mapnumber);
          seriesRoundsTeam1 += row.map_team1_score ?? 0;
          seriesRoundsTeam2 += row.map_team2_score ?? 0;
        }
      }
    }
  }

  // Calcular e gravar ELO para cada membro de cada time
  const eloHistoryRows: {
    profile_id: string;
    match_id: string;
    elo_before: number;
    elo_after: number;
    delta: number;
  }[] = [];

  const profileUpdates: { id: string; newElo: number }[] = [];

  for (const member of allMembers) {
    const profile = profileById.get(member.profile_id);
    if (!profile) continue;

    const isWinner = member.team_id === match.winner_id;
    const opponentAvgElo = member.team_id === match.team1_id ? avgEloTeam2 : avgEloTeam1;

    let seriesKills = 0;
    let seriesDeaths = 0;
    let playerHasStats = false;

    if (hasStats) {
      // Tenta casar por steamid64; se falhar (BIGINT arredondado, etc), tenta player_name.
      const steamKey = normalizeSteamId(profile.steam_id);
      let stat = steamKey ? statsBySteamId.get(steamKey) : undefined;
      if (!stat) {
        const nameKey = normalizePlayerName(profile.steam_persona_name);
        if (nameKey) stat = statsByName.get(nameKey);
      }
      if (stat) {
        seriesKills = stat.kills;
        seriesDeaths = stat.deaths;
        playerHasStats = true;
      }
    }

    // Se a partida tem stats mas esse jogador não aparece → não alterar ELO
    if (hasStats && !playerHasStats) continue;

    // Sem stats (walkover): KD neutro (1/1) e rounds 0/0 → fatores = 0 → puro Elo clássico
    const effectiveKills = playerHasStats ? seriesKills : 1;
    const effectiveDeaths = playerHasStats ? seriesDeaths : 1;

    const isTeam1 = member.team_id === match.team1_id;
    const seriesRoundsWon  = playerHasStats ? (isTeam1 ? seriesRoundsTeam1 : seriesRoundsTeam2) : 0;
    const seriesRoundsLost = playerHasStats ? (isTeam1 ? seriesRoundsTeam2 : seriesRoundsTeam1) : 0;

    const delta = calculateEloDelta(
      profile.elo,
      opponentAvgElo,
      isWinner,
      effectiveKills,
      effectiveDeaths,
      seriesRoundsWon,
      seriesRoundsLost,
      boType
    );

    const eloBefore = profile.elo;
    const eloAfter = Math.max(100, eloBefore + delta); // mínimo de 100 ELO

    eloHistoryRows.push({
      profile_id: member.profile_id,
      match_id: matchId,
      elo_before: eloBefore,
      elo_after: eloAfter,
      delta: eloAfter - eloBefore,
    });

    profileUpdates.push({ id: member.profile_id, newElo: eloAfter });
    // Atualiza o mapa local para que o syncTeamElo use o valor correto
    profileById.set(member.profile_id, { ...profile, elo: eloAfter });
  }

  if (eloHistoryRows.length === 0) {
    if (hasStats) {
      const expectedIds = profileRows.map((p) => p.steam_id).filter(Boolean);
      const expectedNames = profileRows.map((p) => p.steam_persona_name).filter(Boolean);
      const seenIds = [...statsBySteamId.keys()];
      const seenNames = [...statsByName.keys()];
      console.warn(
        `[elo] Match ${matchId}: 0 jogadores casaram com stats. ` +
        `profiles.steam_id=[${expectedIds.join(",")}] ` +
        `profiles.steam_persona_name=[${expectedNames.join(",")}] ` +
        `matchzy.steamid64=[${seenIds.join(",")}] ` +
        `matchzy.player_name=[${seenNames.join(",")}]`
      );
    } else {
      console.log(`[elo] Nenhum jogador com stats para ${matchId}`);
    }
    return;
  }

  // Gravar histórico de ELO
  const { error: historyError } = await supabase.from("elo_history").insert(eloHistoryRows);
  if (historyError) {
    console.error(`[elo] Erro ao gravar elo_history para ${matchId}:`, historyError.message);
    return;
  }

  // Atualizar profiles.elo individualmente (Supabase não suporta bulk UPDATE com valores diferentes)
  await Promise.all(
    profileUpdates.map(({ id, newElo }) =>
      supabase.from("profiles").update({ elo: newElo }).eq("id", id)
    )
  );

  // Re-calcular ELO médio dos times
  await Promise.all([syncTeamElo(match.team1_id), syncTeamElo(match.team2_id)]);

  console.log(`[elo] ELO atualizado para ${eloHistoryRows.length} jogadores — partida ${matchId}`);
}
