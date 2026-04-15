// ---------------------------------------------------------------------------
// BlueStrike — Sistema de patentes CS:GO Legacy
// Mapeia ELO numérico para a patente visual correspondente.
// Imagens servidas em /public/assets/ranks/
// ---------------------------------------------------------------------------

export interface RankInfo {
  /** Nome completo da patente */
  name: string;
  /** Caminho público da imagem (relativo ao /public) */
  imagePath: string;
  /** ELO mínimo desta faixa (inclusivo) */
  minElo: number;
  /** ELO máximo desta faixa (inclusivo) — null = sem limite superior */
  maxElo: number | null;
  /** Texto para tooltip/hover com nome e intervalo */
  tooltip: string;
}

export interface RankGuideEntry {
  name: string;
  imagePath: string;
  minElo: number;
  maxElo: number | null;
  rangeLabel: string;
}

interface RankEntry {
  minElo: number;
  name: string;
  file: string;
}

const RANK_TABLE: RankEntry[] = [
  { minElo: 0,    name: "Silver I",                      file: "Silver_I.svg" },
  { minElo: 100,  name: "Silver II",                     file: "Silver_II.svg" },
  { minElo: 200,  name: "Silver III",                    file: "Silver_III.svg" },
  { minElo: 300,  name: "Silver IV",                     file: "Silver_IV.svg" },
  { minElo: 400,  name: "Silver Elite",                  file: "Silver_Elite.svg" },
  { minElo: 500,  name: "Silver Elite Master",           file: "Silver_Elite_Master.svg" },
  { minElo: 600,  name: "Gold Nova I",                   file: "Gold_Nova_I.svg" },
  { minElo: 800,  name: "Gold Nova II",                  file: "Gold_Nova_II.svg" },
  { minElo: 1000, name: "Gold Nova III",                 file: "Gold_Nova_III.svg" },
  { minElo: 1200, name: "Gold Nova Master",              file: "Gold_Nova_Master.svg" },
  { minElo: 1400, name: "Master Guardian I",             file: "Master_Guardian_I.svg" },
  { minElo: 1700, name: "Master Guardian II",            file: "Master_Guardian_II.svg" },
  { minElo: 2000, name: "Master Guardian Elite",         file: "Master_Guardian_Elite.svg" },
  { minElo: 2300, name: "Distinguished Master Guardian", file: "Distinguished_Master_Guardian.svg" },
  { minElo: 2600, name: "Legendary Eagle",               file: "Legendary_Eagle.svg" },
  { minElo: 2900, name: "Legendary Eagle Master",        file: "Legendary_Eagle_Master.svg" },
  { minElo: 3300, name: "Supreme Master First Class",    file: "Supreme_Master_First_Class.svg" },
  { minElo: 3700, name: "Global Elite",                  file: "The_Global_Elite.svg" },
];

export const RANK_GUIDE: RankGuideEntry[] = RANK_TABLE.map((entry, index) => {
  const next = RANK_TABLE[index + 1];
  const maxElo = next ? next.minElo : null;

  return {
    name: entry.name,
    imagePath: `/assets/ranks/${entry.file}`,
    minElo: entry.minElo,
    maxElo,
    rangeLabel: maxElo === null ? `${entry.minElo}+` : `${entry.minElo}-${maxElo}`,
  };
});

/**
 * Retorna as informações de patente para um dado ELO.
 * Funciona como fallback para null/undefined tratando como 0.
 */
export function getPlayerRank(elo: number | null | undefined): RankInfo {
  const safeElo = typeof elo === "number" && Number.isFinite(elo) ? Math.max(0, elo) : 0;

  let rank = RANK_TABLE[0];

  for (const entry of RANK_TABLE) {
    if (safeElo >= entry.minElo) {
      rank = entry;
    } else {
      break;
    }
  }

  const index = RANK_TABLE.indexOf(rank);
  const next = RANK_TABLE[index + 1];
  const maxElo = next ? next.minElo - 1 : null;

  return {
    name: rank.name,
    imagePath: `/assets/ranks/${rank.file}`,
    minElo: rank.minElo,
    maxElo,
    tooltip: maxElo
      ? `${rank.name} · ${rank.minElo}–${maxElo} ELO`
      : `${rank.name} · ${rank.minElo}+ ELO`,
  };
}
