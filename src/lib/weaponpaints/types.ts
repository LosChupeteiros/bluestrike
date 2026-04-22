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
