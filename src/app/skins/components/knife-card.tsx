"use client";

import { useTransition } from "react";
import Image from "next/image";
import type { SkinEntry } from "@/lib/weaponpaints/types";
import { saveKnife } from "../actions";

interface KnifeCardProps {
  knifeList: Record<number, SkinEntry>;
  currentKnifeWeaponName: string | null;
}

const DEFAULT_KNIFE_NAME = "weapon_knife";

export function KnifeCard({ knifeList, currentKnifeWeaponName }: KnifeCardProps) {
  const [isPending, startTransition] = useTransition();

  const activeEntry = Object.values(knifeList).find(
    (k) => k.weaponName === (currentKnifeWeaponName ?? DEFAULT_KNIFE_NAME)
  ) ?? knifeList[0];

  const activeDefindex = currentKnifeWeaponName
    ? (Object.entries(knifeList).find(([, v]) => v.weaponName === currentKnifeWeaponName)?.[0] ?? "0")
    : "0";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const defindex = parseInt(e.target.value, 10);
    const skin = knifeList[defindex];
    if (!skin) return;

    const fd = new FormData();
    fd.set("defindex", String(defindex));
    fd.set("weaponName", skin.weaponName);
    startTransition(() => saveKnife(fd));
  }

  return (
    <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-colors hover:border-[var(--primary)]/30 w-full max-w-[200px]">
      <div className="relative aspect-[4/3] bg-[var(--secondary)] flex items-center justify-center p-3">
        {isPending && (
          <div className="absolute inset-0 bg-[var(--background)]/60 flex items-center justify-center z-10">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        )}
        {activeEntry && (
          <Image
            src={activeEntry.imageUrl}
            alt={activeEntry.paintName}
            width={160}
            height={120}
            className="object-contain w-full h-full"
            unoptimized
          />
        )}
      </div>

      <div className="p-2 flex flex-col gap-1.5">
        <p className="text-[10px] font-bold text-[var(--primary)]">Faca</p>
        <p className="text-[10px] truncate text-[var(--foreground)]">
          {activeEntry?.paintName ?? "Faca padrão"}
        </p>

        <select
          className="w-full rounded border border-[var(--border)] bg-[var(--secondary)] px-2 py-1 text-[10px] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 transition-colors"
          value={activeDefindex}
          onChange={handleChange}
          disabled={isPending}
        >
          {Object.entries(knifeList).map(([defindexStr, skin]) => (
            <option key={defindexStr} value={defindexStr}>
              {skin.paintName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
