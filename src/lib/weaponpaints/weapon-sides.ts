// Disponibilidade de cada arma por lado no CS2.
// Serve para filtrar os cards do loadout: não faz sentido montar uma AK para o
// CT nem uma M4 para o TR.
//
// Convenção do plugin WeaponPaints: weapon_team 3 = CT, 2 = TR.

export type WeaponSide = "ct" | "t" | "both";

export const TEAM_CT = 3;
export const TEAM_T = 2;

const CT_ONLY = new Set<number>([
  3,  // Five-SeveN
  8,  // AUG
  10, // FAMAS
  16, // M4A4
  27, // MAG-7
  32, // P2000
  34, // MP9
  38, // SCAR-20
  60, // M4A1-S
  61, // USP-S
]);

const T_ONLY = new Set<number>([
  4,  // Glock-18
  7,  // AK-47
  11, // G3SG1
  13, // Galil AR
  17, // MAC-10
  29, // Sawed-Off
  30, // Tec-9
  39, // SG 553
]);

export function getWeaponSide(defindex: number): WeaponSide {
  if (CT_ONLY.has(defindex)) return "ct";
  if (T_ONLY.has(defindex)) return "t";
  return "both";
}

/** A arma aparece quando o filtro é "ambos" ou quando ela existe naquele lado. */
export function weaponMatchesSide(defindex: number, filter: WeaponSide): boolean {
  if (filter === "both") return true;
  const side = getWeaponSide(defindex);
  return side === "both" || side === filter;
}

export function sideToTeam(side: "ct" | "t"): number {
  return side === "ct" ? TEAM_CT : TEAM_T;
}
