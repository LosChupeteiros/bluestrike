"use client";

import { useTransition } from "react";
import Image from "next/image";
import type { MusicEntry } from "@/lib/weaponpaints/types";
import { saveMusic } from "../actions";

interface MusicCardProps {
  musicList: MusicEntry[];
  currentMusicId: number | null;
  team: number;
}

export function MusicCard({ musicList, currentMusicId, team }: MusicCardProps) {
  const [isPending, startTransition] = useTransition();

  const activeMusicId = currentMusicId ?? musicList[0]?.id ?? 1;
  const activeMusic = musicList.find((m) => m.id === activeMusicId) ?? musicList[0];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = parseInt(e.target.value, 10);
    const fd = new FormData();
    fd.set("musicId", String(id));
    fd.set("team", String(team));
    startTransition(() => saveMusic(fd));
  }

  return (
    <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-colors hover:border-[var(--primary)]/30 w-full max-w-[200px]">
      <div className="relative aspect-[4/3] bg-[var(--secondary)] flex items-center justify-center p-3">
        {isPending && (
          <div className="absolute inset-0 bg-[var(--background)]/60 flex items-center justify-center z-10">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        )}
        {activeMusic && (
          <Image
            src={activeMusic.imageUrl}
            alt={activeMusic.name}
            width={160}
            height={120}
            className="object-contain w-full h-full"
            unoptimized
          />
        )}
      </div>

      <div className="p-2 flex flex-col gap-1.5">
        <p className="text-[10px] font-bold text-[var(--primary)]">Kit de Música</p>
        <p className="text-[10px] truncate text-[var(--foreground)]">{activeMusic?.name ?? "—"}</p>

        <select
          className="w-full rounded border border-[var(--border)] bg-[var(--secondary)] px-2 py-1 text-[10px] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 transition-colors"
          value={activeMusicId}
          onChange={handleChange}
          disabled={isPending}
        >
          {musicList.map((kit) => (
            <option key={kit.id} value={kit.id}>
              {kit.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
