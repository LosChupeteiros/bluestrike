import { getBracketRoundModel, type BracketRoundModel } from "@/lib/bracket-model";
import type { MatchStatus } from "@/types";

export interface BracketSeedTeam {
  teamId: string;
  registeredAt: string;
  elo: number;
}

export interface BracketMatchDraft {
  team1Id: string | null;
  team2Id: string | null;
  round: number;
  matchIndex: number;
  status: Extract<MatchStatus, "pending" | "walkover">;
  winnerId: string | null;
  boType: 1 | 3 | 5;
  teamsAssigned: boolean;
}

export interface BracketByeAdvancement {
  winnerId: string;
  round: number;
  matchIndex: number;
  slot: 1 | 2;
}

export interface GeneratedBracket {
  model: BracketRoundModel;
  matches: BracketMatchDraft[];
  byeAdvancements: BracketByeAdvancement[];
}

function sortSeedTeams(teams: BracketSeedTeam[]): BracketSeedTeam[] {
  return [...teams].sort((a, b) => {
    if (b.elo !== a.elo) return b.elo - a.elo;
    const registeredDelta = Date.parse(a.registeredAt) - Date.parse(b.registeredAt);
    if (registeredDelta !== 0) return registeredDelta;
    return a.teamId.localeCompare(b.teamId);
  });
}

function buildSeedPairs(teams: BracketSeedTeam[], bracketSize: number): Array<[BracketSeedTeam | null, BracketSeedTeam | null]> {
  const seededSlots: Array<BracketSeedTeam | null> = sortSeedTeams(teams);
  while (seededSlots.length < bracketSize) seededSlots.push(null);

  const pairs: Array<[BracketSeedTeam | null, BracketSeedTeam | null]> = [];
  for (let left = 0, right = seededSlots.length - 1; left < right; left++, right--) {
    pairs.push([seededSlots[left] ?? null, seededSlots[right] ?? null]);
  }
  return pairs;
}

export function buildSeededSingleEliminationBracket(teams: BracketSeedTeam[]): GeneratedBracket {
  const model = getBracketRoundModel(teams.length);
  const bracketSize = Math.pow(2, model.baseRounds);
  const normalLastRound = model.semifinalRound ?? model.finalRound;
  const seedPairs = buildSeedPairs(teams, bracketSize);
  const matches: BracketMatchDraft[] = [];

  for (let round = 1; round <= normalLastRound; round++) {
    const matchCount = bracketSize / Math.pow(2, round);
    for (let matchIndex = 0; matchIndex < matchCount; matchIndex++) {
      const isFinalRound = round === model.finalRound;
      if (round === 1) {
        const [team1, team2] = seedPairs[matchIndex] ?? [null, null];
        const team1Id = team1?.teamId ?? null;
        const team2Id = team2?.teamId ?? null;
        const isBye = Boolean(team1Id) !== Boolean(team2Id);
        const winnerId = isBye ? (team1Id ?? team2Id) : null;

        matches.push({
          team1Id,
          team2Id,
          round,
          matchIndex,
          status: isBye ? "walkover" : "pending",
          winnerId,
          boType: isFinalRound ? 3 : 1,
          teamsAssigned: Boolean(team1Id && team2Id),
        });
        continue;
      }

      matches.push({
        team1Id: null,
        team2Id: null,
        round,
        matchIndex,
        status: "pending",
        winnerId: null,
        boType: isFinalRound ? 3 : 1,
        teamsAssigned: false,
      });
    }
  }

  if (model.hasThirdPlace && model.thirdPlaceRound !== null) {
    matches.push({
      team1Id: null,
      team2Id: null,
      round: model.thirdPlaceRound,
      matchIndex: 0,
      status: "pending",
      winnerId: null,
      boType: 1,
      teamsAssigned: false,
    });

    matches.push({
      team1Id: null,
      team2Id: null,
      round: model.finalRound,
      matchIndex: 0,
      status: "pending",
      winnerId: null,
      boType: 3,
      teamsAssigned: false,
    });
  }

  const byeAdvancements = matches
    .filter((match) => match.round === 1 && match.status === "walkover" && match.winnerId)
    .map((match): BracketByeAdvancement => ({
      winnerId: match.winnerId!,
      round: 2,
      matchIndex: Math.floor(match.matchIndex / 2),
      slot: match.matchIndex % 2 === 0 ? 1 : 2,
    }));

  return { model, matches, byeAdvancements };
}
