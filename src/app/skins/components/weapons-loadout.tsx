"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { FactionBadge } from "@/components/ui/faction-badge";
import { Link2, Link2Off } from "lucide-react";
import type { SkinEntry, LoadoutSkin } from "@/lib/weaponpaints/types";
import { getWeaponSide, weaponMatchesSide, sideToTeam, type WeaponSide } from "@/lib/weaponpaints/weapon-sides";
import { cn } from "@/lib/utils";
import { saveSkin, saveSkinBothTeams } from "../actions";
import { SkinDialog } from "./skin-dialog";
import { SkinDialogUnified } from "./skin-dialog-unified";

export interface WeaponEntry {
  defindex: number;
  defaultSkin: SkinEntry;
  availableSkins: Record<number, SkinEntry>;
}

interface WeaponsLoadoutProps {
  weapons: WeaponEntry[];
  currentSkinsCT: Record<number, LoadoutSkin>;
  currentSkinsT: Record<number, LoadoutSkin>;
}

const FILTERS: Array<{
  id: WeaponSide;
  label: string;
  hint: string;
  logo?: string;
  accent: string;
}> = [
  { id: "both", label: "Ambos", hint: "Aplica nos dois lados", accent: "var(--primary)" },
  { id: "ct", label: "CT", hint: "Só o arsenal Counter-Terrorist", accent: "#7B96FF" },
  { id: "t", label: "TR", hint: "Só o arsenal Terrorist", accent: "#FB923C" },
];

function SideBadge({ defindex }: { defindex: number }) {
  const side = getWeaponSide(defindex);
  if (side === "both") return null;

  return (
    <span
      className={cn(
        "absolute left-2 top-2 z-10 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-black leading-none backdrop-blur-sm",
        side === "ct"
          ? "bg-[#7B96FF]/20 text-[#7B96FF] ring-1 ring-[#7B96FF]/35"
          : "bg-[#FB923C]/20 text-[#FB923C] ring-1 ring-[#FB923C]/35"
      )}
    >
      {side === "ct" ? "CT" : "TR"}
    </span>
  );
}

function WeaponCard({
  entry,
  filter,
  skinCT,
  skinT,
}: {
  entry: WeaponEntry;
  filter: WeaponSide;
  skinCT: LoadoutSkin | null;
  skinT: LoadoutSkin | null;
}) {
  const [isPending, startTransition] = useTransition();
  const { defindex, defaultSkin, availableSkins } = entry;

  const activeSkin = filter === "t" ? skinT : skinCT;
  const activePaintId = activeSkin?.paintId ?? 0;
  const displaySkin = availableSkins[activePaintId] ?? defaultSkin;

  const weaponSide = getWeaponSide(defindex);
  // Só faz sentido comparar lados quando a arma existe nos dois.
  const sidesDiffer =
    weaponSide === "both" && (skinCT?.paintId ?? 0) !== (skinT?.paintId ?? 0);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const paintId = parseInt(event.target.value, 10);
    const fd = new FormData();
    fd.set("defindex", String(defindex));
    fd.set("paintId", String(paintId));
    fd.set("wear", String(activeSkin?.wear ?? 0.0));
    fd.set("seed", String(activeSkin?.seed ?? 0));

    if (filter === "both") {
      startTransition(() => saveSkinBothTeams(fd));
      return;
    }

    fd.set("team", String(sideToTeam(filter)));
    startTransition(() => saveSkin(fd));
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[#080d15] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)]/35">
      <div className="relative flex aspect-[16/11] items-center justify-center bg-[var(--secondary)] p-4">
        <SideBadge defindex={defindex} />

        {filter === "both" && sidesDiffer && (
          <span
            className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-orange-500/18 px-1.5 py-0.5 text-[9px] font-black leading-none text-orange-300 ring-1 ring-orange-500/30 backdrop-blur-sm"
            title="CT e TR estão com skins diferentes. Salvar aqui iguala os dois lados."
          >
            <Link2Off className="h-2.5 w-2.5" aria-hidden="true" />
            CT ≠ TR
          </span>
        )}

        {isPending && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--background)]/60">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        )}

        <Image
          src={displaySkin.imageUrl}
          alt={displaySkin.paintName}
          width={160}
          height={120}
          className="h-full w-full object-contain"
          unoptimized
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-[var(--border)] p-3">
        <p className="truncate text-xs font-black text-[var(--primary)]" title={displaySkin.paintName}>
          {displaySkin.paintName}
        </p>

        <label className="sr-only" htmlFor={`skin-${defindex}-${filter}`}>
          Skin de {defaultSkin.weaponName}
        </label>
        <select
          id={`skin-${defindex}-${filter}`}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-2 py-2 text-[10px] text-[var(--foreground)] transition-colors focus:border-[var(--primary)]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/45"
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

        {activeSkin &&
          (filter === "both" ? (
            <SkinDialogUnified
              defindex={defindex}
              paintId={activePaintId}
              paintName={displaySkin.paintName}
              currentWear={activeSkin.wear}
              currentSeed={activeSkin.seed}
            />
          ) : (
            <SkinDialog
              defindex={defindex}
              paintId={activePaintId}
              paintName={displaySkin.paintName}
              currentWear={activeSkin.wear}
              currentSeed={activeSkin.seed}
              team={sideToTeam(filter)}
            />
          ))}
      </div>
    </div>
  );
}

export function WeaponsLoadout({ weapons, currentSkinsCT, currentSkinsT }: WeaponsLoadoutProps) {
  const [filter, setFilter] = useState<WeaponSide>("both");

  const visibleWeapons = useMemo(
    () => weapons.filter((w) => weaponMatchesSide(w.defindex, filter)),
    [weapons, filter]
  );

  const divergentCount = useMemo(
    () =>
      weapons.filter(
        (w) =>
          getWeaponSide(w.defindex) === "both" &&
          (currentSkinsCT[w.defindex]?.paintId ?? 0) !== (currentSkinsT[w.defindex]?.paintId ?? 0)
      ).length,
    [weapons, currentSkinsCT, currentSkinsT]
  );

  const activeFilter = FILTERS.find((f) => f.id === filter)!;

  return (
    <div className="bs-bento-card mt-6 space-y-4 p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-base font-black tracking-tight">Armas</p>
            <span className="rounded-full border border-[var(--border)] bg-[var(--secondary)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--muted-foreground)]">
              {visibleWeapons.length}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{activeFilter.hint}</p>
        </div>

        <div
          role="radiogroup"
          aria-label="Lado do loadout"
          className="flex w-full shrink-0 rounded-xl border border-[var(--border)] bg-black/25 p-1 sm:w-auto"
        >
          {FILTERS.map((option) => {
            const isActive = option.id === filter;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setFilter(option.id)}
                style={isActive ? { color: option.accent } : undefined}
                className={cn(
                  "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-black transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50",
                  isActive
                    ? "bg-[var(--secondary)] shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                {option.id === "both" ? (
                  <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <FactionBadge
                    side={option.id}
                    size="sm"
                    className={cn("transition-opacity", !isActive && "opacity-45")}
                  />
                )}
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {filter === "both" && divergentCount > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-orange-500/20 bg-orange-500/8 px-3 py-2 text-[11px] text-orange-200/90">
          <Link2Off className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {divergentCount} {divergentCount === 1 ? "arma está" : "armas estão"} com skins diferentes entre CT e TR.
            Alterar por aqui iguala os dois lados — use as abas CT e TR para manter a diferença.
          </span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {visibleWeapons.map((entry) => (
          <WeaponCard
            key={`${entry.defindex}-${filter}`}
            entry={entry}
            filter={filter}
            skinCT={currentSkinsCT[entry.defindex] ?? null}
            skinT={currentSkinsT[entry.defindex] ?? null}
          />
        ))}
      </div>
    </div>
  );
}
