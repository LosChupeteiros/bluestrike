"use client";

import { useMemo, useState } from "react";
import type { SkinEntry, LoadoutSkin } from "@/lib/weaponpaints/types";
import type { WeaponSide } from "@/lib/weaponpaints/catalog";
import { cn } from "@/lib/utils";
import { WeaponCard } from "./weapon-card";

export interface WeaponPanelEntry {
  defindex: number;
  defaultSkin: SkinEntry;
  availableSkins: Record<number, SkinEntry>;
  side: WeaponSide;
}

interface WeaponsPanelProps {
  weapons: WeaponPanelEntry[];
  /** Skins salvas no lado CT (weapon_team = 3). */
  skinsCT: Record<number, LoadoutSkin>;
  /** Skins salvas no lado TR (weapon_team = 2). */
  skinsT: Record<number, LoadoutSkin>;
}

const SIDES = [
  {
    id: "ct" as const,
    team: 3,
    label: "Counter-Terrorist",
    short: "CT",
    color: "#7B96FF",
    logo: "/assets/sides/Ct_logo.webp",
  },
  {
    id: "t" as const,
    team: 2,
    label: "Terrorist",
    short: "TR",
    color: "#FB923C",
    logo: "/assets/sides/Tr_logo.webp",
  },
];

export function WeaponsPanel({ weapons, skinsCT, skinsT }: WeaponsPanelProps) {
  const [activeSide, setActiveSide] = useState<"ct" | "t">("ct");

  const side = SIDES.find((entry) => entry.id === activeSide)!;
  const currentSkins = activeSide === "ct" ? skinsCT : skinsT;

  // Armas exclusivas do outro lado somem do grid: nao adianta pintar um AK no CT.
  const visibleWeapons = useMemo(
    () => weapons.filter((weapon) => weapon.side === "both" || weapon.side === activeSide),
    [weapons, activeSide]
  );

  const exclusiveCount = visibleWeapons.filter((weapon) => weapon.side !== "both").length;

  return (
    <div className="mt-4 rounded-xl border border-[var(--border)] p-5 space-y-4">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-black tracking-tight">Armas</p>
          <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
            Cada lado guarda o proprio loadout — a skin salva aqui vale so para{" "}
            <span className="font-semibold" style={{ color: side.color }}>
              {side.short}
            </span>
            .
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Lado do loadout"
          className="flex shrink-0 gap-1 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-1"
        >
          {SIDES.map((entry) => {
            const isActive = entry.id === activeSide;

            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveSide(entry.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                  isActive
                    ? "bg-[var(--background)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
                style={isActive ? { color: entry.color } : undefined}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-5 w-5 bg-contain bg-center bg-no-repeat transition-opacity",
                    !isActive && "opacity-45"
                  )}
                  style={{ backgroundImage: `url(${entry.logo})` }}
                />
                {entry.short}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
        <span
          className="rounded-full border px-2 py-0.5 font-bold"
          style={{ color: side.color, borderColor: `${side.color}40`, backgroundColor: `${side.color}14` }}
        >
          {side.label}
        </span>
        <span>{visibleWeapons.length} armas</span>
        <span aria-hidden="true">/</span>
        <span>{exclusiveCount} exclusivas do lado</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
        {visibleWeapons.map(({ defindex, defaultSkin, availableSkins }) => (
          <WeaponCard
            // A key inclui o lado para o card remontar com o estado salvo daquele time.
            key={`${activeSide}-${defindex}`}
            defindex={defindex}
            defaultSkin={defaultSkin}
            availableSkins={availableSkins}
            currentSkin={currentSkins[defindex] ?? null}
            team={side.team}
          />
        ))}
      </div>
    </div>
  );
}
