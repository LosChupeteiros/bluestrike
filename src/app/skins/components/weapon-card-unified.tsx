"use client";

import { useTransition } from "react";
import Image from "next/image";
import type { SkinEntry, LoadoutSkin } from "@/lib/weaponpaints/types";
import { saveSkinBothTeams } from "../actions";
import { SkinDialogUnified } from "./skin-dialog-unified";

interface WeaponCardUnifiedProps {
  defindex: number;
  defaultSkin: SkinEntry;
  availableSkins: Record<number, SkinEntry>;
  currentSkin: LoadoutSkin | null;
}

export function WeaponCardUnified({
  defindex,
  defaultSkin,
  availableSkins,
  currentSkin,
}: WeaponCardUnifiedProps) {
  const [isPending, startTransition] = useTransition();

  const activePaintId = currentSkin?.paintId ?? 0;
  const activeSkin = availableSkins[activePaintId] ?? defaultSkin;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const paintId = parseInt(e.target.value, 10);
    const fd = new FormData();
    fd.set("defindex", String(defindex));
    fd.set("paintId", String(paintId));
    fd.set("wear", String(currentSkin?.wear ?? 0.0));
    fd.set("seed", String(currentSkin?.seed ?? 0));

    startTransition(() => saveSkinBothTeams(fd));
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[#080d15] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)]/35">
      <div className="relative aspect-[16/11] bg-[var(--secondary)] flex items-center justify-center p-4">
        {isPending && (
          <div className="absolute inset-0 bg-[var(--background)]/60 flex items-center justify-center z-10">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        )}
        <Image
          src={activeSkin.imageUrl}
          alt={activeSkin.paintName}
          width={160}
          height={120}
          className="object-contain w-full h-full"
          unoptimized
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-[var(--border)] p-3">
        <p className="truncate text-xs font-black text-[var(--primary)]" title={activeSkin.paintName}>
          {activeSkin.paintName}
        </p>

        <select
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-2 py-2 text-[10px] text-[var(--foreground)] transition-colors focus:border-[var(--primary)]/60 focus:outline-none"
          value={activePaintId}
          onChange={handleChange}
          disabled={isPending}
        >
          {Object.entries(availableSkins).map(([paintIdStr, skin]) => (
            <option key={paintIdStr} value={paintIdStr}>
              {skin.paintName}
            </option>
          ))}
        </select>

        {currentSkin && (
          <SkinDialogUnified
            defindex={defindex}
            paintId={activePaintId}
            paintName={activeSkin.paintName}
            currentWear={currentSkin.wear}
            currentSeed={currentSkin.seed}
          />
        )}
      </div>
    </div>
  );
}
