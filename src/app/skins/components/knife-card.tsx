"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { SkinEntry, SkinCatalog, CurrentSkins } from "@/lib/weaponpaints/types";
import { saveKnife, saveSkin } from "../actions";

interface KnifeCardProps {
  knifeList: Record<number, SkinEntry>;
  currentKnifeWeaponName: string | null;
  skinCatalog: SkinCatalog;
  currentSkins: CurrentSkins;
  team: number;
}

const DEFAULT_KNIFE_NAME = "weapon_knife";

export function KnifeCard({ knifeList, currentKnifeWeaponName, skinCatalog, currentSkins, team }: KnifeCardProps) {
  const [isPending, startTransition] = useTransition();

  const currentDefindex = currentKnifeWeaponName
    ? (Number(Object.entries(knifeList).find(([, v]) => v.weaponName === currentKnifeWeaponName)?.[0] ?? 0))
    : 0;

  const [selectedDefindex, setSelectedDefindex] = useState(currentDefindex);

  const availablePaints = skinCatalog[selectedDefindex] ?? {};
  const currentPaintId = selectedDefindex !== 0 ? (currentSkins[selectedDefindex]?.paintId ?? 0) : 0;
  const [paintId, setPaintId] = useState(currentPaintId);

  const activeSkin = availablePaints[paintId] ?? knifeList[selectedDefindex];

  function doSaveKnife(defindex: number) {
    const skin = knifeList[defindex];
    if (!skin) return;
    const fd = new FormData();
    fd.set("defindex", String(defindex));
    fd.set("weaponName", skin.weaponName);
    fd.set("team", String(team));
    startTransition(() => saveKnife(fd));
  }

  function doSaveSkin(defindex: number, paint: number) {
    if (defindex === 0) return;
    const fd = new FormData();
    fd.set("defindex", String(defindex));
    fd.set("paintId", String(paint));
    fd.set("wear", String(currentSkins[defindex]?.wear ?? 0.0));
    fd.set("seed", String(currentSkins[defindex]?.seed ?? 0));
    fd.set("team", String(team));
    startTransition(() => saveSkin(fd));
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const defindex = parseInt(e.target.value, 10);
    const firstPaint = Number(Object.keys(skinCatalog[defindex] ?? {})[0] ?? 0);
    setSelectedDefindex(defindex);
    setPaintId(firstPaint);
    doSaveKnife(defindex);
    if (defindex !== 0) doSaveSkin(defindex, firstPaint);
  }

  function handlePaintChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const paint = parseInt(e.target.value, 10);
    setPaintId(paint);
    doSaveSkin(selectedDefindex, paint);
  }

  return (
    <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-colors hover:border-[var(--primary)]/30 w-full max-w-[200px]">
      <div className="relative aspect-[4/3] bg-[var(--secondary)] flex items-center justify-center p-3">
        {isPending && (
          <div className="absolute inset-0 bg-[var(--background)]/60 flex items-center justify-center z-10">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        )}
        {activeSkin && (
          <Image
            src={activeSkin.imageUrl}
            alt={activeSkin.paintName}
            width={160}
            height={120}
            className="object-contain w-full h-full"
            unoptimized
          />
        )}
      </div>

      <div className="p-2 flex flex-col gap-1.5">
        <p className="text-[10px] font-bold text-[var(--primary)]">Faca</p>

        <select
          className="w-full rounded border border-[var(--border)] bg-[var(--secondary)] px-2 py-1 text-[10px] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 transition-colors"
          value={selectedDefindex}
          onChange={handleTypeChange}
          disabled={isPending}
        >
          {Object.entries(knifeList).map(([defindexStr, skin]) => (
            <option key={defindexStr} value={defindexStr}>
              {skin.paintName}
            </option>
          ))}
        </select>

        {selectedDefindex !== 0 && Object.keys(availablePaints).length > 0 && (
          <select
            className="w-full rounded border border-[var(--border)] bg-[var(--secondary)] px-2 py-1 text-[10px] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 transition-colors"
            value={paintId}
            onChange={handlePaintChange}
            disabled={isPending}
          >
            {Object.entries(availablePaints).map(([paintIdStr, skin]) => (
              <option key={paintIdStr} value={paintIdStr}>
                {skin.paintName}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
