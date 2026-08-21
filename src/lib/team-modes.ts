// Modalidades de time/campeonato (1x1 ... 5x5).
// Este módulo é seguro para client components — não contém segredos nem IDs de
// servidor Dathost. A resolução do servidor espelho fica em `@/lib/match-flow`.

export type TeamMode = "1v1" | "2v2" | "3v3" | "4v4" | "5v5";

export type MapPoolId = "competitive" | "wingman" | "aim";

export interface TeamModeConfig {
  id: TeamMode;
  /** Rótulo curto usado na interface: "1x1", "2x2", ... */
  label: string;
  /** Nome da modalidade dentro do CS2 */
  gameModeLabel: string;
  playersPerTeam: number;
  /** Titulares + reservas permitidos no elenco */
  maxMembers: number;
  mapPool: MapPoolId;
  /** MatchZy roda em modo wingman (2v2) */
  wingman: boolean;
  /** Lados fixos por mapa — 1x1 nunca usa faca */
  fixedSides: boolean;
  /** Envia `mp_free_armor 1` no console ao iniciar */
  freeArmor: boolean;
  description: string;
}

export const TEAM_MODES: Record<TeamMode, TeamModeConfig> = {
  "1v1": {
    id: "1v1",
    label: "1x1",
    gameModeLabel: "Duelo",
    playersPerTeam: 1,
    // O 1x1 é o próprio capitão — não existe reserva.
    maxMembers: 1,
    mapPool: "aim",
    wingman: false,
    fixedSides: true,
    freeArmor: true,
    description: "Duelo direto em mapas de aim. Sem faca, lados definidos e colete liberado.",
  },
  "2v2": {
    id: "2v2",
    label: "2x2",
    gameModeLabel: "Wingman",
    playersPerTeam: 2,
    maxMembers: 3,
    mapPool: "wingman",
    wingman: true,
    fixedSides: false,
    freeArmor: false,
    description: "Wingman oficial com mapa pool própria de duplas.",
  },
  "3v3": {
    id: "3v3",
    label: "3x3",
    gameModeLabel: "Competitivo",
    playersPerTeam: 3,
    maxMembers: 4,
    mapPool: "competitive",
    wingman: false,
    fixedSides: false,
    freeArmor: false,
    description: "Competitivo em mapa pool padrão com trios.",
  },
  "4v4": {
    id: "4v4",
    label: "4x4",
    gameModeLabel: "Competitivo",
    playersPerTeam: 4,
    maxMembers: 5,
    mapPool: "competitive",
    wingman: false,
    fixedSides: false,
    freeArmor: false,
    description: "Competitivo em mapa pool padrão com quartetos.",
  },
  "5v5": {
    id: "5v5",
    label: "5x5",
    gameModeLabel: "Competitivo",
    playersPerTeam: 5,
    maxMembers: 6,
    mapPool: "competitive",
    wingman: false,
    fixedSides: false,
    freeArmor: false,
    description: "Formato oficial 5x5 com mapa pool competitiva e reserva.",
  },
};

export const TEAM_MODE_LIST: TeamModeConfig[] = [
  TEAM_MODES["1v1"],
  TEAM_MODES["2v2"],
  TEAM_MODES["3v3"],
  TEAM_MODES["4v4"],
  TEAM_MODES["5v5"],
];

export const DEFAULT_TEAM_MODE: TeamMode = "5v5";

export function isTeamMode(value: unknown): value is TeamMode {
  return typeof value === "string" && value in TEAM_MODES;
}

/** Aceita "5v5", "5x5" ou null e devolve sempre um modo válido. */
export function normalizeTeamMode(value: unknown, fallback: TeamMode = DEFAULT_TEAM_MODE): TeamMode {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase().replace("x", "v");
  return isTeamMode(normalized) ? normalized : fallback;
}

export function getTeamMode(value: unknown): TeamModeConfig {
  return TEAM_MODES[normalizeTeamMode(value)];
}

export function getPlayersPerTeam(value: unknown): number {
  return getTeamMode(value).playersPerTeam;
}

export function getTeamModeLabel(value: unknown): string {
  return getTeamMode(value).label;
}
