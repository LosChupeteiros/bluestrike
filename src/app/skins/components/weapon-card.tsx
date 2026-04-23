"use client";

import { useTransition } from "react";
import Image from "next/image";
import type { SkinEntry, LoadoutSkin } from "@/lib/weaponpaints/types";
import { SkinDialog } from "./skin-dialog";
import { saveSkin } from "../actions";

interface WeaponCardProps {
  defindex: number;
  defaultSkin: SkinEntry;
  availableSkins: Record<number, SkinEntry>;
  currentSkin: LoadoutSkin | null;
  team: number;
}

export function WeaponCard({ defindex, defaultSkin, availableSkins, currentSkin, team }: WeaponCardProps) {
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
    fd.set("team", String(team));

    startTransition(() => saveSkin(fd));
  }

  return (
    <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-colors hover:border-[var(--primary)]/30">
      <div className="relative aspect-[4/3] bg-[var(--secondary)] flex items-center justify-center p-3">
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

      <div className="p-2 flex flex-col gap-1.5">
        <p className="text-[10px] font-bold truncate text-[var(--primary)]" title={activeSkin.paintName}>
          {activeSkin.paintName}
        </p>

        <select
          className="w-full rounded border border-[var(--border)] bg-[var(--secondary)] px-2 py-1 text-[10px] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 transition-colors"
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
          <SkinDialog
            defindex={defindex}
            paintId={activePaintId}
            paintName={activeSkin.paintName}
            currentWear={currentSkin.wear}
            currentSeed={currentSkin.seed}
            team={team}
          />
        )}
      </div>
    </div>
  );
}
