export interface BracketRoundModel {
  baseRounds: number;
  hasThirdPlace: boolean;
  semifinalRound: number | null;
  thirdPlaceRound: number | null;
  finalRound: number;
}

export function getBracketRoundModel(teamCount: number): BracketRoundModel {
  const normalizedTeamCount = Math.max(2, Math.trunc(teamCount));
  const baseRounds = Math.ceil(Math.log2(normalizedTeamCount));
  const hasThirdPlace = normalizedTeamCount >= 4;

  return {
    baseRounds,
    hasThirdPlace,
    semifinalRound: hasThirdPlace ? Math.max(1, baseRounds - 1) : null,
    thirdPlaceRound: hasThirdPlace ? baseRounds : null,
    finalRound: hasThirdPlace ? baseRounds + 1 : baseRounds,
  };
}

export function isThirdPlaceRound(round: number, model: BracketRoundModel): boolean {
  return model.thirdPlaceRound !== null && round === model.thirdPlaceRound;
}

export function isFinalRound(round: number, model: BracketRoundModel): boolean {
  return round === model.finalRound;
}

export function getBracketRoundLabel(round: number, model: BracketRoundModel): string {
  if (isFinalRound(round, model)) return "Final";
  if (isThirdPlaceRound(round, model)) return "Disputa de 3º lugar";
  if (model.semifinalRound !== null && round === model.semifinalRound) return "Semifinal";
  if (model.semifinalRound !== null && round === model.semifinalRound - 1 && round >= 1) return "Quartas de Final";
  return `Rodada ${round}`;
}
