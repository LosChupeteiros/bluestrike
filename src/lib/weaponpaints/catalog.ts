import type { SkinCatalog, SkinEntry, GloveCatalog, MusicEntry, AgentEntry } from "./types";
import skinsRaw from "@/data/weaponpaints/skins_pt-BR.json";
import glovesRaw from "@/data/weaponpaints/gloves_pt-BR.json";
import musicRaw from "@/data/weaponpaints/music_pt-BR.json";
import agentsRaw from "@/data/weaponpaints/agents_pt-BR.json";

interface RawSkinEntry {
  weapon_defindex: number;
  weapon_name: string;
  paint: number | string;
  image: string;
  paint_name: string;
  legacy_model?: boolean;
}

interface RawGloveEntry {
  weapon_defindex: number;
  paint: number | string;
  image: string;
  paint_name: string;
}

interface RawMusicEntry {
  id: string;
  name: string;
  image: string;
}

interface RawAgentEntry {
  model: string;
  name: string;
  team: "ct" | "t";
  image: string;
}

const KNIFE_DEFINDEXES = new Set([
  0, 500, 503, 505, 506, 507, 508, 509, 512, 514, 515, 516, 517, 518, 519,
  520, 521, 522, 523, 525, 526,
]);

let _catalog: SkinCatalog | null = null;
let _gloveCatalog: GloveCatalog | null = null;
let _musicList: MusicEntry[] | null = null;
let _agentList: AgentEntry[] | null = null;

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

function buildGloveCatalog(): GloveCatalog {
  if (_gloveCatalog) return _gloveCatalog;

  const catalog: GloveCatalog = {};

  for (const raw of glovesRaw as RawGloveEntry[]) {
    const defindex = raw.weapon_defindex;
    const paintId = Number(raw.paint);

    if (defindex === 0) continue;

    if (!catalog[defindex]) {
      const typeName = raw.paint_name.split(" | ")[0]?.replace("★", "").trim() ?? raw.paint_name;
      catalog[defindex] = { typeName, paints: {} };
    }

    const paintDisplayName = raw.paint_name.split(" | ")[1]?.trim() ?? raw.paint_name;
    catalog[defindex].paints[paintId] = {
      paintName: paintDisplayName,
      imageUrl: raw.image,
    };
  }

  _gloveCatalog = catalog;
  return catalog;
}

export function getGloveCatalog(): GloveCatalog {
  return buildGloveCatalog();
}

export function isValidGlove(defindex: number, paintId: number): boolean {
  if (defindex === 0) return true;
  const catalog = buildGloveCatalog();
  return Boolean(catalog[defindex]?.paints[paintId]);
}

function buildMusicList(): MusicEntry[] {
  if (_musicList) return _musicList;
  _musicList = (musicRaw as RawMusicEntry[]).map((raw) => ({
    id: parseInt(raw.id, 10),
    name: raw.name,
    imageUrl: raw.image,
  }));
  return _musicList;
}

export function getMusicList(): MusicEntry[] {
  return buildMusicList();
}

export function isValidMusic(id: number): boolean {
  return buildMusicList().some((m) => m.id === id);
}

function buildAgentList(): AgentEntry[] {
  if (_agentList) return _agentList;
  _agentList = (agentsRaw as RawAgentEntry[]).map((raw) => ({
    model: raw.model,
    name: raw.name,
    team: raw.team,
    imageUrl: raw.image,
  }));
  return _agentList;
}

export function getAgentList(): { ct: AgentEntry[]; t: AgentEntry[] } {
  const all = buildAgentList();
  return {
    ct: all.filter((a) => a.team === "ct"),
    t: all.filter((a) => a.team === "t"),
  };
}

export function isValidAgent(model: string): boolean {
  return buildAgentList().some((a) => a.model === model);
}
