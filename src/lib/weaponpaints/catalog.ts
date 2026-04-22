import type { SkinCatalog, SkinEntry } from "./types";
import skinsRaw from "@/data/weaponpaints/skins_pt-BR.json";

interface RawSkinEntry {
  weapon_defindex: number;
  weapon_name: string;
  paint: number | string;
  image: string;
  paint_name: string;
  legacy_model?: boolean;
}

const KNIFE_DEFINDEXES = new Set([
  0, 500, 503, 505, 506, 507, 508, 509, 512, 514, 515, 516, 517, 518, 519,
  520, 521, 522, 523, 525, 526,
]);

let _catalog: SkinCatalog | null = null;

function buildCatalog(): SkinCatalog {
  if (_catalog) return _catalog;

  const catalog: SkinCatalog = {};

  for (const raw of skinsRaw as RawSkinEntry[]) {
    const defindex = raw.weapon_defindex;
    const paintId = Number(raw.paint);

    if (!catalog[defindex]) {
      catalog[defindex] = {};
    }

    catalog[defindex][paintId] = {
      weaponName: raw.weapon_name,
      paintName: raw.paint_name,
      imageUrl: raw.image,
    };
  }

  _catalog = catalog;
  return catalog;
}

export function getSkinsByWeapon(): SkinCatalog {
  return buildCatalog();
}

export function getWeaponList(): Record<number, SkinEntry> {
  const catalog = buildCatalog();
  const weapons: Record<number, SkinEntry> = {};

  for (const [defindexStr, skins] of Object.entries(catalog)) {
    const defindex = Number(defindexStr);
    if (KNIFE_DEFINDEXES.has(defindex)) continue;
    const defaultSkin = skins[0];
    if (defaultSkin) {
      weapons[defindex] = defaultSkin;
    }
  }

  return weapons;
}

export function getKnifeList(): Record<number, SkinEntry> {
  const catalog = buildCatalog();
  const knives: Record<number, SkinEntry> = {
    0: {
      weaponName: "weapon_knife",
      paintName: "Faca padrão",
      imageUrl:
        "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_knife.png",
    },
  };

  for (const [defindexStr, skins] of Object.entries(catalog)) {
    const defindex = Number(defindexStr);
    if (defindex === 0 || !KNIFE_DEFINDEXES.has(defindex)) continue;
    const defaultSkin = skins[0];
    if (defaultSkin) {
      knives[defindex] = {
        ...defaultSkin,
        paintName: defaultSkin.paintName.split("|")[0]?.trim() ?? defaultSkin.paintName,
      };
    }
  }

  return knives;
}

export function isValidSkin(defindex: number, paintId: number): boolean {
  const catalog = buildCatalog();
  return Boolean(catalog[defindex]?.[paintId]);
}

export function isValidKnife(defindex: number): boolean {
  return KNIFE_DEFINDEXES.has(defindex);
}
