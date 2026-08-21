import type { MapPoolId, TeamMode } from "@/lib/team-modes";
import { getTeamMode } from "@/lib/team-modes";

export interface MapPresentation {
  /** Chave única e estável — é o valor gravado em `map_vetoes.map_name`. */
  name: string;
  /** Nome exibido na interface. Igual a `name` na pool competitiva. */
  label: string;
  /**
   * Identificador enviado ao MatchZy em `maplist`.
   * Pool competitiva usa o nome interno do CS2 ("de_mirage");
   * pools de wingman/aim usam o ID do item da Workshop.
   */
  mapId: string;
  localImage: string;
  /** Presente apenas em mapas da Steam Workshop. */
  workshopId?: string;
  workshopUrl?: string;
}

function workshop(id: string) {
  return `https://steamcommunity.com/sharedfiles/filedetails/?id=${id}`;
}

// ── Pool competitiva — 3x3, 4x4 e 5x5 ────────────────────────────────────────

export const CS2_MAP_POOL: MapPresentation[] = [
  { name: "Mirage",   label: "Mirage",   mapId: "de_mirage",   localImage: "/assets/maps/mirage.jpg" },
  { name: "Inferno",  label: "Inferno",  mapId: "de_inferno",  localImage: "/assets/maps/inferno.jpg" },
  { name: "Ancient",  label: "Ancient",  mapId: "de_ancient",  localImage: "/assets/maps/ancient.jpg" },
  { name: "Anubis",   label: "Anubis",   mapId: "de_anubis",   localImage: "/assets/maps/anubis.jpg" },
  { name: "Dust2",    label: "Dust2",    mapId: "de_dust2",    localImage: "/assets/maps/dust2.jpg" },
  { name: "Nuke",     label: "Nuke",     mapId: "de_nuke",     localImage: "/assets/maps/nuke.jpg" },
  { name: "Overpass", label: "Overpass", mapId: "de_overpass", localImage: "/assets/maps/overpass.webp" },
];

// ── Pool wingman — 2x2 ───────────────────────────────────────────────────────
// Chaves prefixadas com `wm_` porque "Ancient" também existe na pool competitiva.

export const WINGMAN_MAP_POOL: MapPresentation[] = [
  { name: "wm_rialto",       label: "Rialto",       mapId: "3085490518", workshopId: "3085490518", workshopUrl: workshop("3085490518"), localImage: "/assets/maps/wingman/rialto.jpg" },
  { name: "wm_rio",          label: "Rio",          mapId: "3568752102", workshopId: "3568752102", workshopUrl: workshop("3568752102"), localImage: "/assets/maps/wingman/rio.jpg" },
  { name: "wm_ancient",      label: "Ancient",      mapId: "3484112405", workshopId: "3484112405", workshopUrl: workshop("3484112405"), localImage: "/assets/maps/wingman/ancient_wingman.jpg" },
  { name: "wm_shortdust",    label: "Shortdust",    mapId: "3070612859", workshopId: "3070612859", workshopUrl: workshop("3070612859"), localImage: "/assets/maps/wingman/shortdust.jpg" },
  { name: "wm_express",      label: "Express",      mapId: "3369669148", workshopId: "3369669148", workshopUrl: workshop("3369669148"), localImage: "/assets/maps/wingman/express.jpg" },
  { name: "wm_cobblestone",  label: "Cobblestone",  mapId: "3645126146", workshopId: "3645126146", workshopUrl: workshop("3645126146"), localImage: "/assets/maps/wingman/cobblestone.webp" },
  { name: "wm_lake",         label: "Lake",         mapId: "3219506727", workshopId: "3219506727", workshopUrl: workshop("3219506727"), localImage: "/assets/maps/wingman/lake.jpg" },
];

// ── Pool de aim — 1x1 ────────────────────────────────────────────────────────

export const AIM_MAP_POOL: MapPresentation[] = [
  { name: "aim_crashz",     label: "Aim Crashz",   mapId: "305726849",  workshopId: "305726849",  workshopUrl: workshop("305726849"),  localImage: "/assets/maps/aim_map/aim_crashz.jpg" },
  { name: "aim_deagle_usp", label: "Deagle & USP", mapId: "3076190232", workshopId: "3076190232", workshopUrl: workshop("3076190232"), localImage: "/assets/maps/aim_map/aim_deagle.jpg" },
  { name: "aim_redline",    label: "Aim Redline",  mapId: "3710410548", workshopId: "3710410548", workshopUrl: workshop("3710410548"), localImage: "/assets/maps/aim_map/aim_redline.jpg" },
  { name: "awp_india",      label: "AWP India",    mapId: "3070411770", workshopId: "3070411770", workshopUrl: workshop("3070411770"), localImage: "/assets/maps/aim_map/awp_india.jpg" },
  { name: "awp_lego",       label: "AWP Lego",     mapId: "3767826671", workshopId: "3767826671", workshopUrl: workshop("3767826671"), localImage: "/assets/maps/aim_map/awp_lego.png" },
  { name: "aim_ancient",    label: "Aim Ancient",  mapId: "3090340064", workshopId: "3090340064", workshopUrl: workshop("3090340064"), localImage: "/assets/maps/aim_map/ancient_1x1.jpg" },
  { name: "aim_map",        label: "Aim Map",      mapId: "3084291314", workshopId: "3084291314", workshopUrl: workshop("3084291314"), localImage: "/assets/maps/aim_map/aim_map.jpg" },
];

const POOLS: Record<MapPoolId, MapPresentation[]> = {
  competitive: CS2_MAP_POOL,
  wingman: WINGMAN_MAP_POOL,
  aim: AIM_MAP_POOL,
};

export const CS2_MAP_NAMES = CS2_MAP_POOL.map((m) => m.name);

const ALL_MAPS = [...CS2_MAP_POOL, ...WINGMAN_MAP_POOL, ...AIM_MAP_POOL];
const MAP_BY_NAME = new Map(ALL_MAPS.map((m) => [m.name, m]));
const MAP_BY_ID = new Map(ALL_MAPS.map((m) => [m.mapId, m]));

export function getMapPool(poolId: MapPoolId): MapPresentation[] {
  return POOLS[poolId] ?? CS2_MAP_POOL;
}

/** Pool de mapas usada por um modo de time (1v1 → aim, 2v2 → wingman, resto → competitiva). */
export function getMapPoolForMode(mode: TeamMode | string | null | undefined): MapPresentation[] {
  return getMapPool(getTeamMode(mode).mapPool);
}

export function getMapPresentation(mapKey: string): MapPresentation | null {
  return MAP_BY_NAME.get(mapKey) ?? MAP_BY_ID.get(mapKey) ?? null;
}

/**
 * Nome amigável a partir da chave salva no banco, do ID do CS2 ou do nome que o
 * MatchZy devolve no fim da série.
 */
export function getMapLabel(mapKey: string | null | undefined): string {
  if (!mapKey) return "A definir";
  const found = getMapPresentation(mapKey);
  if (found) return found.label;
  return mapKey.replace(/^(?:de|ar|cs|dm)_/, "");
}

/** Mapa que sobrou depois de todos os bans/picks de uma pool específica. */
export function findDeciderMap(
  pool: MapPresentation[],
  pickedNames: string[],
  bannedNames: Set<string>
): MapPresentation | null {
  return pool.find((m) => !pickedNames.includes(m.name) && !bannedNames.has(m.name)) ?? null;
}

// Veto sequences — returns ordered slots with whose turn it is and the action type.
export type VetoSlot = { turn: "team1" | "team2"; action: "ban" | "pick" };

export function getVetoSequence(boType: 1 | 3 | 5): VetoSlot[] {
  if (boType === 1) {
    // 6 alternating vetoes, last map remaining is played
    return [
      { turn: "team1", action: "ban" },
      { turn: "team2", action: "ban" },
      { turn: "team1", action: "ban" },
      { turn: "team2", action: "ban" },
      { turn: "team1", action: "ban" },
      { turn: "team2", action: "ban" },
    ];
  }
  if (boType === 3) {
    // ban ban pick pick ban ban → decider is remaining
    return [
      { turn: "team1", action: "ban" },
      { turn: "team2", action: "ban" },
      { turn: "team1", action: "pick" },
      { turn: "team2", action: "pick" },
      { turn: "team1", action: "ban" },
      { turn: "team2", action: "ban" },
    ];
  }
  // BO5: pick pick pick pick, ban ban → last is decider
  return [
    { turn: "team1", action: "ban" },
    { turn: "team2", action: "ban" },
    { turn: "team1", action: "pick" },
    { turn: "team2", action: "pick" },
    { turn: "team1", action: "pick" },
    { turn: "team2", action: "pick" },
  ];
}

/**
 * Lados pré-definidos usados no 1x1: nunca existe faca e o primeiro mapa começa
 * sempre com o time 1 no CT, alternando a cada mapa da série.
 */
export function getFixedMapSides(mapCount: number): string[] {
  return Array.from({ length: Math.max(0, mapCount) }, (_, index) =>
    index % 2 === 0 ? "team1_ct" : "team2_ct"
  );
}
