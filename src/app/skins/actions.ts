"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentProfile } from "@/lib/profiles";
import { getWeaponPaintsPool } from "@/lib/weaponpaints/mysql";
import {
  upsertSkin,
  upsertKnife,
  upsertGlove,
  upsertMusic,
  deleteSkin,
  getCurrentKnife,
  getCurrentGlove,
} from "@/lib/weaponpaints/queries";
import { isValidSkin, isValidKnife, isValidGlove, isValidMusic, getKnifeList } from "@/lib/weaponpaints/catalog";

const teamSchema = z.coerce.number().int().refine((v) => v === 2 || v === 3);

const skinSchema = z.object({
  defindex: z.coerce.number().int().positive(),
  paintId: z.coerce.number().int().min(0),
  wear: z.coerce.number().min(0).max(1),
  seed: z.coerce.number().int().min(0).max(1000),
  team: teamSchema,
});

const knifeSchema = z.object({
  defindex: z.coerce.number().int().min(0),
  weaponName: z.string().min(1),
  team: teamSchema,
});

const gloveFullSchema = z.object({
  defindex: z.coerce.number().int().min(0),
  paintId: z.coerce.number().int().min(0),
  wear: z.coerce.number().min(0).max(1),
  seed: z.coerce.number().int().min(0).max(1000),
  team: teamSchema,
});

const musicSchema = z.object({
  musicId: z.coerce.number().int().min(1),
  team: teamSchema,
});

export async function saveSkin(formData: FormData) {
  const profile = await requireCurrentProfile("/skins");

  const parsed = skinSchema.safeParse({
    defindex: formData.get("defindex"),
    paintId: formData.get("paintId"),
    wear: formData.get("wear"),
    seed: formData.get("seed"),
    team: formData.get("team"),
  });

  if (!parsed.success) return;

  const { defindex, paintId, wear, seed, team } = parsed.data;

  if (!isValidSkin(defindex, paintId)) return;

  const pool = getWeaponPaintsPool();
  if (!pool) return;

  await upsertSkin(pool, profile.steamId, defindex, paintId, wear, seed, team);
  revalidatePath("/skins");
}

export async function saveKnife(formData: FormData) {
  const profile = await requireCurrentProfile("/skins");

  const parsed = knifeSchema.safeParse({
    defindex: formData.get("defindex"),
    weaponName: formData.get("weaponName"),
    team: formData.get("team"),
  });

  if (!parsed.success) return;

  const { defindex, weaponName, team } = parsed.data;

  if (defindex !== 0 && !isValidKnife(defindex)) return;

  const pool = getWeaponPaintsPool();
  if (!pool) return;

  // When knife type changes, remove the old knife's skin record so no orphans remain
  const prevKnifeWeaponName = await getCurrentKnife(pool, profile.steamId, team);
  if (prevKnifeWeaponName && prevKnifeWeaponName !== weaponName) {
    const knifeList = getKnifeList();
    const oldEntry = Object.entries(knifeList).find(([, v]) => v.weaponName === prevKnifeWeaponName);
    const oldDefindex = oldEntry ? Number(oldEntry[0]) : 0;
    if (oldDefindex !== 0) {
      await deleteSkin(pool, profile.steamId, oldDefindex, team);
    }
  }

  await upsertKnife(pool, profile.steamId, weaponName, team);
  revalidatePath("/skins");
}

export async function saveGloveFull(formData: FormData) {
  const profile = await requireCurrentProfile("/skins");

  const parsed = gloveFullSchema.safeParse({
    defindex: formData.get("defindex"),
    paintId: formData.get("paintId"),
    wear: formData.get("wear"),
    seed: formData.get("seed"),
    team: formData.get("team"),
  });

  if (!parsed.success) return;

  const { defindex, paintId, wear, seed, team } = parsed.data;

  const pool = getWeaponPaintsPool();
  if (!pool) return;

  // When glove type changes, remove the old glove's skin record so no orphans remain
  const prevGlove = await getCurrentGlove(pool, profile.steamId, team);
  if (prevGlove && prevGlove.defindex !== 0 && prevGlove.defindex !== defindex) {
    await deleteSkin(pool, profile.steamId, prevGlove.defindex, team);
  }

  await upsertGlove(pool, profile.steamId, defindex, team);

  if (defindex !== 0) {
    if (!isValidGlove(defindex, paintId)) return;
    await upsertSkin(pool, profile.steamId, defindex, paintId, wear, seed, team);
  }

  revalidatePath("/skins");
}

export async function saveMusic(formData: FormData) {
  const profile = await requireCurrentProfile("/skins");

  const parsed = musicSchema.safeParse({
    musicId: formData.get("musicId"),
    team: formData.get("team"),
  });

  if (!parsed.success) return;

  const { musicId, team } = parsed.data;

  if (!isValidMusic(musicId)) return;

  const pool = getWeaponPaintsPool();
  if (!pool) return;

  await upsertMusic(pool, profile.steamId, musicId, team);
  revalidatePath("/skins");
}
