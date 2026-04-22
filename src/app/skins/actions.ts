"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentProfile } from "@/lib/profiles";
import { getWeaponPaintsPool } from "@/lib/weaponpaints/mysql";
import { upsertSkin, upsertKnife } from "@/lib/weaponpaints/queries";
import { isValidSkin, isValidKnife } from "@/lib/weaponpaints/catalog";

const skinSchema = z.object({
  defindex: z.coerce.number().int().positive(),
  paintId: z.coerce.number().int().min(0),
  wear: z.coerce.number().min(0).max(1),
  seed: z.coerce.number().int().min(0).max(1000),
});

const knifeSchema = z.object({
  defindex: z.coerce.number().int().min(0),
  weaponName: z.string().min(1),
});

export async function saveSkin(formData: FormData) {
  const profile = await requireCurrentProfile("/skins");

  const parsed = skinSchema.safeParse({
    defindex: formData.get("defindex"),
    paintId: formData.get("paintId"),
    wear: formData.get("wear"),
    seed: formData.get("seed"),
  });

  if (!parsed.success) return;

  const { defindex, paintId, wear, seed } = parsed.data;

  if (!isValidSkin(defindex, paintId)) return;

  const pool = getWeaponPaintsPool();
  if (!pool) return;

  await upsertSkin(pool, profile.steamId, defindex, paintId, wear, seed);
  revalidatePath("/skins");
}

export async function saveKnife(formData: FormData) {
  const profile = await requireCurrentProfile("/skins");

  const parsed = knifeSchema.safeParse({
    defindex: formData.get("defindex"),
    weaponName: formData.get("weaponName"),
  });

  if (!parsed.success) return;

  const { defindex, weaponName } = parsed.data;

  if (defindex !== 0 && !isValidKnife(defindex)) return;

  const pool = getWeaponPaintsPool();
  if (!pool) return;

  await upsertKnife(pool, profile.steamId, weaponName);
  revalidatePath("/skins");
}
