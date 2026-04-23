"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { GloveCatalog, CurrentGlove, CurrentSkins } from "@/lib/weaponpaints/types";
import { saveGloveFull } from "../actions";

interface GloveCardProps {
  gloveCatalog: GloveCatalog;
  currentGlove: CurrentGlove | null;
  currentSkins: CurrentSkins;
  team: number;
}

export function GloveCard({ gloveCatalog, currentGlove, currentSkins, team }: GloveCardProps) {
  const [isPending, startTransition] = useTransition();
  const [defindex, setDefindex] = useState(currentGlove?.defindex ?? 0);

  const typeEntry = gloveCatalog[defindex];
  const currentPaintId = defindex !== 0 ? (currentSkins[defindex]?.paintId ?? Number(Object.keys(typeEntry?.paints ?? {})[0] ?? 0)) : 0;
  const [paintId, setPaintId] = useState(currentPaintId);

  const activePaint = typeEntry?.paints[paintId];

  function doSave(def: number, paint: number) {
    const fd = new FormData();
    fd.set("defindex", String(def));
    fd.set("paintId", String(paint));
    fd.set("wear", "0.01");
    fd.set("seed", "0");
    fd.set("team", String(team));
    startTransition(() => saveGloveFull(fd));
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const def = parseInt(e.target.value, 10);
    const entry = gloveCatalog[def];
    const firstPaint = entry ? Number(Object.keys(entry.paints)[0]) : 0;
    setDefindex(def);
    setPaintId(firstPaint);
    doSave(def, firstPaint);
  }

  function handlePaintChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const paint = parseInt(e.target.value, 10);
    setPaintId(paint);
    doSave(defindex, paint);
  }

  return (
    <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-colors hover:border-[var(--primary)]/30 w-full max-w-[200px]">
      <div className="relative aspect-[4/3] bg-[var(--secondary)] flex items-center justify-center p-3">
        {isPending && (
          <div className="absolute inset-0 bg-[var(--background)]/60 flex items-center justify-center z-10">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        )}
        {activePaint?.imageUrl ? (
          <Image
            src={activePaint.imageUrl}
            alt={activePaint.paintName}
            width={160}
            height={120}
            className="object-contain w-full h-full"
            unoptimized
          />
        ) : (
          <span className="text-[10px] text-[var(--muted-foreground)]">Padrão</span>
        )}
      </div>

      <div className="p-2 flex flex-col gap-1.5">
        <p className="text-[10px] font-bold text-[var(--primary)]">Luvas</p>

        <select
          className="w-full rounded border border-[var(--border)] bg-[var(--secondary)] px-2 py-1 text-[10px] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 transition-colors"
          value={defindex}
          onChange={handleTypeChange}
          disabled={isPending}
        >
          <option value={0}>Sem luvas</option>
          {Object.entries(gloveCatalog).map(([defStr, type]) => (
            <option key={defStr} value={defStr}>
              {type.typeName}
            </option>
          ))}
        </select>

        {defindex !== 0 && typeEntry && (
          <select
            className="w-full rounded border border-[var(--border)] bg-[var(--secondary)] px-2 py-1 text-[10px] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 transition-colors"
            value={paintId}
            onChange={handlePaintChange}
            disabled={isPending}
          >
            {Object.entries(typeEntry.paints).map(([paintStr, paint]) => (
              <option key={paintStr} value={paintStr}>
                {paint.paintName}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
