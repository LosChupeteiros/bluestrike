export interface SkinEntry {
  weaponName: string;
  paintName: string;
  imageUrl: string;
}

export interface LoadoutSkin {
  paintId: number;
  wear: number;
  seed: number;
}

export type SkinCatalog = Record<number, Record<number, SkinEntry>>;
export type CurrentSkins = Record<number, LoadoutSkin>;

export interface GlovePaintEntry {
  paintName: string;
  imageUrl: string;
}

export interface GloveTypeEntry {
  typeName: string;
  paints: Record<number, GlovePaintEntry>;
}

export type GloveCatalog = Record<number, GloveTypeEntry>;

export interface CurrentGlove {
  defindex: number;
}

export interface MusicEntry {
  id: number;
  name: string;
  imageUrl: string;
}

export interface AgentEntry {
  model: string;
  name: string;
  team: "ct" | "t";
  imageUrl: string;
}

export interface CurrentAgents {
  ct: string | null;
  t: string | null;
}
