// ── Championship Match types ─────────────────────────────────────────────────

export interface FaceitMatchRoster {
  playerId: string;
  nickname: string;
  avatar: string | null;
  gameSkillLevel: number;
}

export interface FaceitMatchFaction {
  factionId: string;
  name: string;
  avatar: string | null;
  roster: FaceitMatchRoster[];
}

export interface FaceitMatch {
  matchId: string;
  /** "ONGOING" | "FINISHED" | "CANCELLED" | "ABORTED" | "READY" | "CONFIGURING" | "SCHEDULED" */
  status: string;
  round: number;
  group: number;
  bestOf: number;
  /** unix seconds */
  scheduledAt: number;
  startedAt: number;
  teams: {
    faction1: FaceitMatchFaction;
    faction2: FaceitMatchFaction;
  };
  results: {
    /** "faction1" | "faction2" | "" */
    winner: string;
    score: { faction1: number; faction2: number };
  };
  /** picked maps, e.g. ["de_mirage", "de_nuke"] */
  maps: string[];
  faceitUrl: string;
}

// ── Championship Subscription types ─────────────────────────────────────────

export interface FaceitSubMember {
  userId: string;
  nickname: string;
  avatar: string | null;
  country: string;
  skillLevel: number;
  faceitUrl: string;
}

export interface FaceitSubscribedTeam {
  teamId: string;
  name: string;
  avatar: string | null;
  leader: string;
  group: number;
  /** "playing" | "checkin" | "joined" | "cancelled" | "disqualified" */
  status: string;
  members: FaceitSubMember[];
  /** IDs dos jogadores titulares */
  roster: string[];
  substitutes: string[];
  teamUrl: string;
}

// ── Team members ─────────────────────────────────────────────────────────────

export interface FaceitMember {
  userId: string;
  nickname: string;
  avatar: string | null;
  faceitUrl: string;
  membership: "leader" | "member" | string;
}

export interface FaceitTeam {
  teamId: string;
  name: string;
  nickname: string;
  avatar: string | null;
  faceitUrl: string;
  members: FaceitMember[];
}

// ── Faceit Championship ──────────────────────────────────────────────────────

export interface FaceitChampionship {
  id: string;
  name: string;
  coverImage: string | null;
  backgroundImage: string | null;
  avatar: string | null;
  organizerId: string;
  description: string;
  type: string;
  status: string; // "join" | "checking_in" | "ongoing" | "finished" | "cancelled"
  gameId: string;
  region: string;
  featured: boolean;
  subscriptionStart: number; // unix ms
  checkinStart: number;
  checkinClear: number;
  subscriptionEnd: number;
  championshipStart: number;
  slots: number;
  currentSubscriptions: number;
  joinChecks: {
    minSkillLevel: number;
    maxSkillLevel: number;
    joinPolicy: string;
    allowedTeamTypes: string[];
    whitelistCountries: string[];
    blacklistCountries: string[];
    membershipType: string;
  };
  anticheatRequired: boolean;
  full: boolean;
  checkinEnabled: boolean;
  totalRounds: number;
  schedule: Record<string, { date: number; status: string }>;
  totalGroups: number;
  subscriptionsLocked: boolean;
  faceitUrl: string;
  totalPrizes: number;
  // DB-managed prize breakdown (admin-set)
  prizeFirst: number | null;
  prizeSecond: number | null;
  prizeThird: number | null;
  // Taxa de inscrição (admin-set)
  entryFee: number;
  stream: {
    active: boolean;
    platform: string;
    source: string;
    title: string;
  };
  rulesId: string;
}

function mapChampionship(raw: Record<string, unknown>): FaceitChampionship {
  const jc = (raw.join_checks as Record<string, unknown>) ?? {};
  const st = (raw.stream as Record<string, unknown>) ?? {};
  return {
    id: String(raw.championship_id ?? raw.id ?? ""),
    name: String(raw.name ?? ""),
    coverImage: raw.cover_image ? String(raw.cover_image) : null,
    backgroundImage: raw.background_image ? String(raw.background_image) : null,
    avatar: raw.avatar ? String(raw.avatar) : null,
    organizerId: String(raw.organizer_id ?? ""),
    description: String(raw.description ?? ""),
    type: String(raw.type ?? "bracket"),
    status: String(raw.status ?? "upcoming"),
    gameId: String(raw.game_id ?? "cs2"),
    region: String(raw.region ?? ""),
    featured: Boolean(raw.featured),
    subscriptionStart: Number(raw.subscription_start ?? 0),
    checkinStart: Number(raw.checkin_start ?? 0),
    checkinClear: Number(raw.checkin_clear ?? 0),
    subscriptionEnd: Number(raw.subscription_end ?? 0),
    championshipStart: Number(raw.championship_start ?? 0),
    slots: Number(raw.slots ?? 0),
    currentSubscriptions: Number(raw.current_subscriptions ?? 0),
    joinChecks: {
      minSkillLevel: Number(jc.min_skill_level ?? 1),
      maxSkillLevel: Number(jc.max_skill_level ?? 10),
      joinPolicy: String(jc.join_policy ?? "public"),
      allowedTeamTypes: Array.isArray(jc.allowed_team_types)
        ? (jc.allowed_team_types as unknown[]).map(String)
        : [],
      whitelistCountries: Array.isArray(jc.whitelist_geo_countries)
        ? (jc.whitelist_geo_countries as unknown[]).map(String)
        : [],
      blacklistCountries: Array.isArray(jc.blacklist_geo_countries)
        ? (jc.blacklist_geo_countries as unknown[]).map(String)
        : [],
      membershipType: String(jc.membership_type ?? ""),
    },
    anticheatRequired: Boolean(raw.anticheat_required),
    full: Boolean(raw.full),
    checkinEnabled: Boolean(raw.checkin_enabled),
    totalRounds: Number(raw.total_rounds ?? 0),
    schedule: (raw.schedule as Record<string, { date: number; status: string }>) ?? {},
    totalGroups: Number(raw.total_groups ?? 1),
    subscriptionsLocked: Boolean(raw.subscriptions_locked),
    faceitUrl: raw.faceit_url ? String(raw.faceit_url).replace("{lang}", "pt-br") : "",
    totalPrizes: Number(raw.total_prizes ?? 0),
    prizeFirst: null,
    prizeSecond: null,
    prizeThird: null,
    entryFee: 0,
    stream: {
      active: Boolean(st.active),
      platform: String(st.platform ?? ""),
      source: String(st.source ?? ""),
      title: String(st.title ?? ""),
    },
    rulesId: String(raw.rules_id ?? ""),
  };
}

// opts.activeOnly (default true): filter out finished/cancelled, purge stale DB prizes.
// Pass activeOnly: false from the admin panel to see all statuses.
export async function getFaceitChampionships(
  opts: { activeOnly?: boolean } = {}
): Promise<FaceitChampionship[]> {
  const apiKey = process.env.FACEIT_API_KEY;
  const organizerId = process.env.BLUESTRIKE_FACEIT_ID;

  if (!apiKey || !organizerId) return [];

  try {
    const res = await fetch(
      `https://open.faceit.com/data/v4/organizers/${organizerId}/championships?limit=20`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) return [];

    const data = (await res.json()) as { items?: unknown[] };
    const all = (data.items ?? []).map((item) =>
      mapChampionship(item as Record<string, unknown>)
    );

    const activeOnly = opts.activeOnly !== false;
    const shown = activeOnly
      ? all.filter((c) => c.status !== "finished" && c.status !== "cancelled")
      : all;

    // Enrich with admin-managed prizes from DB
    const { getFaceitPrizes, purgeStaleFaceitPrizes } = await import("@/lib/faceit-prizes");
    const prizes = await getFaceitPrizes();
    const prizeMap = new Map(prizes.map((p) => [p.championshipId, p]));

    const enriched = shown.map((c) => {
      const p = prizeMap.get(c.id);
      if (!p) return c;
      return {
        ...c,
        totalPrizes: p.prizeTotal > 0 ? p.prizeTotal : c.totalPrizes,
        prizeFirst: p.prizeFirst > 0 ? p.prizeFirst : null,
        prizeSecond: p.prizeSecond > 0 ? p.prizeSecond : null,
        prizeThird: p.prizeThird > 0 ? p.prizeThird : null,
        entryFee: p.entryFee,
      };
    });

    // Passive cleanup: remove prize records for championships that are gone/done
    if (activeOnly) {
      await purgeStaleFaceitPrizes(shown.map((c) => c.id));
    }

    return enriched;
  } catch {
    return [];
  }
}

export async function getFaceitChampionshipById(id: string): Promise<FaceitChampionship | null> {
  const apiKey = process.env.FACEIT_API_KEY;

  if (!apiKey || !id) return null;

  try {
    const res = await fetch(
      `https://open.faceit.com/data/v4/championships/${id}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as Record<string, unknown>;
    const championship = mapChampionship(data);

    // Enrich with admin prizes
    const { getFaceitPrizes } = await import("@/lib/faceit-prizes");
    const prizes = await getFaceitPrizes();
    const p = prizes.find((pr) => pr.championshipId === id);
    if (p) {
      return {
        ...championship,
        totalPrizes: p.prizeTotal > 0 ? p.prizeTotal : championship.totalPrizes,
        prizeFirst: p.prizeFirst > 0 ? p.prizeFirst : null,
        prizeSecond: p.prizeSecond > 0 ? p.prizeSecond : null,
        prizeThird: p.prizeThird > 0 ? p.prizeThird : null,
        entryFee: p.entryFee,
      };
    }

    return championship;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────

async function faceitGet(url: string, apiKey: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) return null;

  return res.json() as Promise<unknown>;
}

function resolveLang(url: string) {
  return url.replace("{lang}", "pt-br");
}

export async function getFaceitTeams(faceitPlayerId: string): Promise<FaceitTeam[]> {
  const apiKey = process.env.FACEIT_API_KEY;

  if (!apiKey || !faceitPlayerId) return [];

  try {
    const data = (await faceitGet(
      `https://open.faceit.com/data/v4/players/${faceitPlayerId}/teams`,
      apiKey
    )) as { items?: unknown[] } | null;

    const items = data?.items;

    if (!Array.isArray(items) || items.length === 0) return [];

    // Filtra CS2 e limita a 6 times
    const cs2Items = (items as Record<string, unknown>[])
      .filter((t) => t.game === "cs2")
      .slice(0, 6);

    if (cs2Items.length === 0) return [];

    // Busca detalhes de cada time em paralelo (avatar + members)
    const details = await Promise.all(
      cs2Items.map((t) =>
        faceitGet(
          `https://open.faceit.com/data/v4/teams/${String(t.team_id)}`,
          apiKey
        )
      )
    );

    return cs2Items.map((item, i) => {
      const d = details[i] as Record<string, unknown> | null;

      const rawMembers = Array.isArray(d?.members)
        ? (d!.members as Record<string, unknown>[])
        : [];

      const members: FaceitMember[] = rawMembers.map((m) => ({
        userId: String(m.user_id ?? ""),
        nickname: String(m.nickname ?? ""),
        avatar: m.avatar ? String(m.avatar) : null,
        faceitUrl: m.faceit_url ? resolveLang(String(m.faceit_url)) : "",
        membership: String(m.membership ?? "member"),
      }));

      const faceitUrl = item.faceit_url
        ? resolveLang(String(item.faceit_url))
        : d?.faceit_url
          ? resolveLang(String(d.faceit_url))
          : "";

      return {
        teamId: String(item.team_id ?? ""),
        name: String(d?.name ?? item.name ?? item.nickname ?? ""),
        nickname: String(d?.nickname ?? item.nickname ?? ""),
        avatar: d?.avatar ? String(d.avatar) : item.avatar ? String(item.avatar) : null,
        faceitUrl,
        members,
      };
    });
  } catch {
    return [];
  }
}

// ── Championship Matches ─────────────────────────────────────────────────────

export async function getFaceitChampionshipMatches(
  championshipId: string
): Promise<FaceitMatch[]> {
  const apiKey = process.env.FACEIT_API_KEY;
  if (!apiKey || !championshipId) return [];

  function mapFaction(f: Record<string, unknown>): FaceitMatchFaction {
    const roster = Array.isArray(f.roster)
      ? (f.roster as Record<string, unknown>[]).map((p): FaceitMatchRoster => ({
          playerId: String(p.player_id ?? ""),
          nickname: String(p.nickname ?? ""),
          avatar: p.avatar ? String(p.avatar) : null,
          gameSkillLevel: Number(p.game_skill_level ?? 0),
        }))
      : [];
    return {
      factionId: String(f.faction_id ?? ""),
      name: String(f.name ?? ""),
      avatar: f.avatar ? String(f.avatar) : null,
      roster,
    };
  }

  function mapMatch(raw: unknown): FaceitMatch {
    const r = raw as Record<string, unknown>;
    const teams = (r.teams as Record<string, unknown>) ?? {};
    const results = (r.results as Record<string, unknown>) ?? {};
    const rawScore = (results.score as Record<string, number>) ?? {};
    const voting = (r.voting as Record<string, unknown>) ?? {};
    const mapPick = ((voting.map as Record<string, unknown>)?.pick as string[] | undefined) ?? [];

    // FACEIT championship endpoint stores results.score as series-level {faction1:1, faction2:0}.
    // detailed_results is a top-level array with one entry per map played.
    //
    // BO1  → show round score from the single map  (e.g. 16-8)
    // BO3+ → show maps won across the series       (e.g. 2-1)
    const detailedResults = Array.isArray(r.detailed_results)
      ? (r.detailed_results as Record<string, unknown>[])
      : [];
    const bestOf = Number(r.best_of ?? 1);
    let score: { faction1: number; faction2: number };
    if (detailedResults.length > 0 && bestOf === 1) {
      // BO1: read round score from the single map's factions object
      const factions = (detailedResults[0].factions as Record<string, Record<string, unknown>>) ?? {};
      score = {
        faction1: Number(factions.faction1?.score ?? rawScore.faction1 ?? 0),
        faction2: Number(factions.faction2?.score ?? rawScore.faction2 ?? 0),
      };
    } else if (detailedResults.length > 0) {
      // BO3+: count maps won by each faction
      score = {
        faction1: detailedResults.filter((d) => String(d.winner ?? "") === "faction1").length,
        faction2: detailedResults.filter((d) => String(d.winner ?? "") === "faction2").length,
      };
    } else {
      score = { faction1: rawScore.faction1 ?? 0, faction2: rawScore.faction2 ?? 0 };
    }

    return {
      matchId: String(r.match_id ?? ""),
      status: String(r.status ?? ""),
      round: Number(r.round ?? 1),
      group: Number(r.group ?? 1),
      bestOf: Number(r.best_of ?? 1),
      scheduledAt: Number(r.scheduled_at ?? 0),
      startedAt: Number(r.started_at ?? 0),
      teams: {
        faction1: mapFaction((teams.faction1 as Record<string, unknown>) ?? {}),
        faction2: mapFaction((teams.faction2 as Record<string, unknown>) ?? {}),
      },
      results: {
        winner: String(results.winner ?? ""),
        score,
      },
      maps: mapPick,
      faceitUrl: r.faceit_url ? resolveLang(String(r.faceit_url)) : "",
    };
  }

  try {
    // FACEIT returns different subsets of matches depending on the `type` parameter
    // AND even the default (no-type) call returns a different half of the bracket.
    // To guarantee full coverage, fetch all four variants in parallel and merge.
    const base = `https://open.faceit.com/data/v4/championships/${championshipId}/matches`;
    const h = { Authorization: `Bearer ${apiKey}` };
    const rv = { revalidate: 60 } as const;

    const [defRes, pastRes, ongoingRes, upcomingRes] = await Promise.all([
      fetch(`${base}?limit=100`,               { headers: h, next: rv }),
      fetch(`${base}?type=past&limit=100`,     { headers: h, next: rv }),
      fetch(`${base}?type=ongoing&limit=100`,  { headers: h, next: rv }),
      fetch(`${base}?type=upcoming&limit=100`, { headers: h, next: rv }),
    ]);

    async function items(res: Response): Promise<unknown[]> {
      if (!res.ok) return [];
      const d = (await res.json()) as { items?: unknown[] };
      return d.items ?? [];
    }

    const [defItems, pastItems, ongoingItems, upcomingItems] = await Promise.all([
      items(defRes),
      items(pastRes),
      items(ongoingRes),
      items(upcomingRes),
    ]);

    // Merge all four batches and deduplicate by match_id
    const seen = new Set<string>();
    const unique = [...defItems, ...pastItems, ...ongoingItems, ...upcomingItems].filter((raw) => {
      const id = String((raw as Record<string, unknown>).match_id ?? "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const mapped = unique.map(mapMatch);

    // Enrich FINISHED matches with real scores from /matches/{id}/stats.
    // The championship endpoint stores results.score as a series-level win/loss (1-0),
    // not the actual round score. Stats endpoint has "Final Score" per team (BO1)
    // and "Team Win" per map (BO3+). Stats are immutable → cache for 1 hour.
    const finished = mapped.filter((m) => m.status === "FINISHED");
    const scoreOverrides = new Map<string, { faction1: number; faction2: number }>();

    if (finished.length > 0) {
      const settled = await Promise.allSettled(
        finished.map(async (match): Promise<{ matchId: string; score: { faction1: number; faction2: number } } | null> => {
          const sRes = await fetch(
            `https://open.faceit.com/data/v4/matches/${match.matchId}/stats`,
            { headers: h, next: { revalidate: 3600 } as const }
          );
          if (!sRes.ok) return null;

          const sData = (await sRes.json()) as { rounds?: unknown[] };
          const rounds = (sData.rounds ?? []) as Record<string, unknown>[];
          if (rounds.length === 0) return null;

          if (match.bestOf === 1) {
            // BO1 — single map: read "Final Score" for each team and map to faction
            const teams = (rounds[0].teams ?? []) as Record<string, unknown>[];
            let f1 = match.results.score.faction1;
            let f2 = match.results.score.faction2;
            for (const t of teams) {
              const tid = String(t.team_id ?? "");
              const s = Number((t.team_stats as Record<string, unknown> | undefined)?.["Final Score"] ?? -1);
              if (s < 0) continue;
              if (tid === match.teams.faction1.factionId) f1 = s;
              else if (tid === match.teams.faction2.factionId) f2 = s;
            }
            return { matchId: match.matchId, score: { faction1: f1, faction2: f2 } };
          } else {
            // BO3+ — count maps won by each faction via "Team Win"
            let f1Maps = 0;
            let f2Maps = 0;
            for (const round of rounds) {
              for (const t of ((round.teams ?? []) as Record<string, unknown>[])) {
                const tid = String(t.team_id ?? "");
                const won = String((t.team_stats as Record<string, unknown> | undefined)?.["Team Win"] ?? "0") === "1";
                if (!won) continue;
                if (tid === match.teams.faction1.factionId) f1Maps++;
                else if (tid === match.teams.faction2.factionId) f2Maps++;
              }
            }
            return { matchId: match.matchId, score: { faction1: f1Maps, faction2: f2Maps } };
          }
        })
      );

      for (const r of settled) {
        if (r.status === "fulfilled" && r.value) {
          scoreOverrides.set(r.value.matchId, r.value.score);
        }
      }
    }

    return mapped.map((m) => {
      const ov = scoreOverrides.get(m.matchId);
      if (!ov) return m;
      return { ...m, results: { ...m.results, score: ov } };
    });
  } catch {
    return [];
  }
}

// ── Championship Subscriptions ───────────────────────────────────────────────

export async function getFaceitChampionshipSubscriptions(
  championshipId: string
): Promise<FaceitSubscribedTeam[]> {
  const apiKey = process.env.FACEIT_API_KEY;
  if (!apiKey || !championshipId) return [];

  try {
    const res = await fetch(
      `https://open.faceit.com/data/v4/championships/${championshipId}/subscriptions?limit=200`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return [];

    const data = (await res.json()) as { items?: unknown[] };
    const items = data.items ?? [];

    // Mapeamento inicial sem avatar
    const subscriptions = (items as Record<string, unknown>[]).map((raw): FaceitSubscribedTeam => {
      const r = raw as Record<string, unknown>;
      const team = (r.team as Record<string, unknown>) ?? {};
      const members = Array.isArray(team.members)
        ? (team.members as Record<string, unknown>[]).map((m): FaceitSubMember => ({
            userId: String(m.user_id ?? ""),
            nickname: String(m.nickname ?? ""),
            avatar: m.avatar ? String(m.avatar) : null,
            country: String(m.country ?? ""),
            skillLevel: Number(m.skill_level ?? 0),
            faceitUrl: m.faceit_url ? resolveLang(String(m.faceit_url)) : "",
          }))
        : [];

      return {
        teamId: String(team.team_id ?? ""),
        name: String(team.name ?? ""),
        avatar: null,
        leader: String(r.leader ?? ""),
        group: Number(r.group ?? 1),
        status: String(r.status ?? ""),
        members,
        roster: Array.isArray(r.roster) ? (r.roster as string[]) : [],
        substitutes: Array.isArray(r.substitutes) ? (r.substitutes as string[]) : [],
        teamUrl: team.faceit_url ? resolveLang(String(team.faceit_url)) : "",
      };
    });

    // Busca avatar real de cada time via GET /v4/teams/{id} em paralelo
    const teamIds = subscriptions.map((s) => s.teamId).filter(Boolean);
    const teamDetails = await Promise.all(
      teamIds.map((id) =>
        faceitGet(`https://open.faceit.com/data/v4/teams/${id}`, apiKey)
          .then((d) => ({ id, avatar: (d as Record<string, unknown>)?.avatar ?? null }))
          .catch(() => ({ id, avatar: null }))
      )
    );
    const avatarMap = new Map(teamDetails.map((t) => [t.id, t.avatar ? String(t.avatar) : null]));

    return subscriptions.map((s) => ({ ...s, avatar: avatarMap.get(s.teamId) ?? null }));
  } catch {
    return [];
  }
}
