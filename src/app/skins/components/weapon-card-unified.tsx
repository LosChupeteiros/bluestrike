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
    <div className="group flex flex-col overflow-hidden rounded-lg border border-white/[0.07] bg-surface/40 transition-colors duration-300 hover:border-white/[0.18]">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-void/50 p-3">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-void/70 backdrop-blur-[2px]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-strike border-r-transparent" />
          </div>
        )}
        <Image
          src={activeSkin.imageUrl}
          alt={activeSkin.paintName}
          width={160}
          height={120}
          className="h-full w-full object-contain transition-transform duration-500 [transition-timing-function:var(--ease-out-quint)] group-hover:scale-[1.06]"
          unoptimized
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-line/60 p-2.5">
        <p className="truncate text-[11px] font-semibold text-ink" title={activeSkin.paintName}>
          {activeSkin.paintName}
        </p>

        <select
          className="w-full rounded-md border border-line bg-void px-2 py-1.5 font-mono text-[10px] text-ink-2 transition-colors duration-300 hover:border-line-2 focus:border-strike/60 focus:outline-none"
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
