import { normalizeTeamSize } from "@/lib/utils";

export interface MapPresentation {
  name: string;
  mapId: string; // CS2 in-game map identifier (e.g. "de_mirage")
  localImage: string;
  /**
   * ID do item na Workshop. So os mapas de wingman tem — e e ele, nao o `mapId`,
   * que vai no `maplist` do MatchZy para o servidor achar o mapa.
   */
  workshopId?: string;
}

export const CS2_MAP_POOL: MapPresentation[] = [
  { name: "Mirage",   mapId: "de_mirage",   localImage: "/assets/maps/mirage.jpg" },
  { name: "Inferno",  mapId: "de_inferno",  localImage: "/assets/maps/inferno.jpg" },
  { name: "Ancient",  mapId: "de_ancient",  localImage: "/assets/maps/ancient.jpg" },
  { name: "Anubis",   mapId: "de_anubis",   localImage: "/assets/maps/anubis.jpg" },
  { name: "Dust2",    mapId: "de_dust2",    localImage: "/assets/maps/dust2.jpg" },
  { name: "Nuke",     mapId: "de_nuke",     localImage: "/assets/maps/nuke.jpg" },
  { name: "Overpass", mapId: "de_overpass", localImage: "/assets/maps/overpass.webp" },
];

/**
 * Mapa pool de wingman (1x1 e 2x2). Sao mapas da Workshop: o veto mostra nome e
 * imagem, mas o payload do MatchZy leva o `workshopId`.
 */
export const WINGMAN_MAP_POOL: MapPresentation[] = [
  { name: "Shortdust",   mapId: "de_shortdust",  workshopId: "3070612859", localImage: "/assets/maps/wingman/shortdust_3070612859.jpg" },
  { name: "Rialto",      mapId: "gd_rialto",     workshopId: "3085490518", localImage: "/assets/maps/wingman/rialto_3085490518.jpg" },
  { name: "Shorttrain",  mapId: "de_shorttrain", workshopId: "125439738",  localImage: "/assets/maps/wingman/shorttrain_125439738.jpg" },
  { name: "Cobblestone", mapId: "de_cbble",      workshopId: "205239595",  localImage: "/assets/maps/wingman/cobblestone_205239595.jpg" },
  { name: "Lake",        mapId: "de_lake",       workshopId: "3219506727", localImage: "/assets/maps/wingman/lake_3219506727.jpg" },
];

/** 1x1 e 2x2 rodam em wingman; 3x3, 4x4 e 5x5 usam o pool competitivo padrao. */
export function isWingmanFormat(teamSize: number | null | undefined): boolean {
  return normalizeTeamSize(teamSize) <= 2;
}

export function getMapPool(teamSize: number | null | undefined): MapPresentation[] {
  return isWingmanFormat(teamSize) ? WINGMAN_MAP_POOL : CS2_MAP_POOL;
}

/** Referencia que o MatchZy entende no `maplist`: workshop ID ou nome do mapa. */
export function getMatchzyMapRef(map: MapPresentation): string {
  return map.workshopId ?? map.mapId;
}

export const CS2_MAP_NAMES = CS2_MAP_POOL.map((m) => m.name);

const ALL_MAPS = [...CS2_MAP_POOL, ...WINGMAN_MAP_POOL];
const MAP_BY_NAME = Object.fromEntries(ALL_MAPS.map((m) => [m.name, m]));
const MAP_BY_ID = Object.fromEntries(ALL_MAPS.map((m) => [m.mapId, m]));

/** Busca nos dois pools — os nomes nao colidem entre competitivo e wingman. */
export function getMapPresentation(mapName: string): MapPresentation | null {
  return MAP_BY_NAME[mapName] ?? MAP_BY_ID[mapName] ?? null;
}

// Veto sequences — returns ordered slots with whose turn it is and the action type.
export type VetoSlot = { turn: "team1" | "team2"; action: "ban" | "pick" };

/**
 * Monta a sequencia de veto para o tamanho real do pool.
 *
 * O pool competitivo tem 7 mapas e o de wingman tem 5, entao a quantidade de
 * bans nao pode ser fixa — o que e fixo e quantos mapas a serie precisa no fim:
 * BO1 = 1, BO3 = 3 (2 picks + sobra), BO5 = 5 (4 picks + sobra).
 * O ultimo mapa nunca e pickado: e sempre o que sobra.
 */
export function getVetoSequence(
  boType: 1 | 3 | 5,
  poolSize: number = CS2_MAP_POOL.length
): VetoSlot[] {
  const actions: Array<"ban" | "pick"> = [];

  if (boType === 1) {
    // Bane tudo menos um.
    for (let i = 0; i < poolSize - 1; i++) actions.push("ban");
  } else if (boType === 3) {
    // ban ban pick pick [bans restantes] -> sobra o decider
    actions.push("ban", "ban", "pick", "pick");
    for (let i = 0; i < Math.max(0, poolSize - 5); i++) actions.push("ban");
  } else {
    // [bans restantes] pick x4 -> sobra o decider
    for (let i = 0; i < Math.max(0, poolSize - 5); i++) actions.push("ban");
    actions.push("pick", "pick", "pick", "pick");
  }

  // Turnos sempre alternando, comecando pelo team1.
  return actions.map((action, index) => ({
    turn: index % 2 === 0 ? ("team1" as const) : ("team2" as const),
    action,
  }));
}
