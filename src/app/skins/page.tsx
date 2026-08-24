import { FactionBadge } from "@/components/ui/faction-badge";
import KnifeShowcase from "@/components/skins/knife-showcase";
import CountUp from "@/components/motion/count-up";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { getCurrentProfile } from "@/lib/profiles";
import { getWeaponPaintsPool } from "@/lib/weaponpaints/mysql";
import { getCurrentSkins, getCurrentKnife, getCurrentGlove, getCurrentMusic } from "@/lib/weaponpaints/queries";
import { getSkinsByWeapon, getWeaponList, getKnifeList, getGloveCatalog, getMusicList } from "@/lib/weaponpaints/catalog";
import { KnifeCard } from "./components/knife-card";
import { GloveCard } from "./components/glove-card";
import { MusicCard } from "./components/music-card";
import { WeaponsLoadout } from "./components/weapons-loadout";

export const metadata: Metadata = {
  title: "Skins",
  description: "Escolha suas skins para o servidor BlueStrike.",
};

const SIDE_CONFIG = {
  ct: {
    team: 3,
    name: "Counter-Terrorist",
    short: "CT",
    accent: "#7B96FF",
  },
  t: {
    team: 2,
    name: "Terrorist",
    short: "TR",
    accent: "#FB923C",
  },
} as const;

function SlotLabel({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <p
      className="mb-2 text-[9px] font-black uppercase tracking-[0.18em]"
      style={{ color: `color-mix(in srgb, ${accent} 70%, var(--muted-foreground))` }}
    >
      {children}
    </p>
  );
}

function SideKitPanel({
  side,
  knifeList,
  knife,
  catalog,
  skins,
  gloveCatalog,
  glove,
  musicList,
  music,
}: {
  side: "ct" | "t";
  knifeList: ReturnType<typeof getKnifeList>;
  knife: string | null;
  catalog: ReturnType<typeof getSkinsByWeapon>;
  skins: Awaited<ReturnType<typeof getCurrentSkins>>;
  gloveCatalog: ReturnType<typeof getGloveCatalog>;
  glove: Awaited<ReturnType<typeof getCurrentGlove>>;
  musicList: ReturnType<typeof getMusicList>;
  music: number | null;
}) {
  const cfg = SIDE_CONFIG[side];
  const filled = [knife, glove?.defindex ? glove : null, music].filter(Boolean).length;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border bg-[var(--card)]"
      style={{ borderColor: `color-mix(in srgb, ${cfg.accent} 22%, transparent)` }}
    >
      {/* Luz do lado no topo do painel */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{
          background: `radial-gradient(70% 100% at 20% 0%, color-mix(in srgb, ${cfg.accent} 14%, transparent), transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <header
        className="relative flex items-center gap-3 border-b px-5 py-4"
        style={{ borderColor: `color-mix(in srgb, ${cfg.accent} 16%, var(--border))` }}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-black/30"
          style={{ borderColor: `color-mix(in srgb, ${cfg.accent} 28%, transparent)` }}
        >
          <FactionBadge side={side} size="lg" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-base font-black tracking-tight" style={{ color: cfg.accent }}>
            {cfg.name}
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Kit {cfg.short}
          </p>
        </div>

        <span
          className="shrink-0 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-black"
          style={{
            borderColor: `color-mix(in srgb, ${cfg.accent} 28%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${cfg.accent} 10%, transparent)`,
            color: cfg.accent,
          }}
        >
          {filled}/3
        </span>
      </header>

      <div className="relative grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <SlotLabel accent={cfg.accent}>Faca</SlotLabel>
          <KnifeCard
            knifeList={knifeList}
            currentKnifeWeaponName={knife}
            skinCatalog={catalog}
            currentSkins={skins}
            team={cfg.team}
          />
        </div>

        <div>
          <SlotLabel accent={cfg.accent}>Luvas</SlotLabel>
          <GloveCard
            gloveCatalog={gloveCatalog}
            currentGlove={glove}
            currentSkins={skins}
            team={cfg.team}
          />
        </div>

        <div>
          <SlotLabel accent={cfg.accent}>Música</SlotLabel>
          <MusicCard musicList={musicList} currentMusicId={music} team={cfg.team} />
        </div>
      </div>
    </section>
  );
}

export default async function SkinsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/auth/login?next=/skins");
  }

  const pool = getWeaponPaintsPool();

  if (!pool) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight">Skins</h1>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">Skins indisponíveis no momento</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              O servidor de personalização está em manutenção. Tente novamente em breve.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const dbData = await Promise.all([
    getCurrentSkins(pool, profile.steamId, 3),
    getCurrentKnife(pool, profile.steamId, 3),
    getCurrentGlove(pool, profile.steamId, 3),
    getCurrentMusic(pool, profile.steamId, 3),
    getCurrentSkins(pool, profile.steamId, 2),
    getCurrentKnife(pool, profile.steamId, 2),
    getCurrentGlove(pool, profile.steamId, 2),
    getCurrentMusic(pool, profile.steamId, 2),
  ]).catch((err: unknown) => {
    console.error("[skins] MySQL query failed:", err instanceof Error ? err.message : err);
    return null;
  });

  if (!dbData) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight">Skins</h1>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">Skins indisponíveis no momento</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              O servidor de personalização está em manutenção. Tente novamente em breve.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [
    skinsCT, knifeCT, gloveCT, musicCT,
    skinsT, knifeT, gloveT, musicT,
  ] = dbData;

  const catalog = getSkinsByWeapon();
  const weaponList = getWeaponList();
  const knifeList = getKnifeList();
  const gloveCatalog = getGloveCatalog();
  const musicList = getMusicList();

  const weaponEntries = Object.entries(weaponList).map(([defindexStr, defaultSkin]) => ({
    defindex: Number(defindexStr),
    defaultSkin,
    availableSkins: catalog[Number(defindexStr)] ?? {},
  }));

  return (
    <div className="bs-page pb-24 pt-28">
      <div className="bs-shell">

        <header className="bs-bento-card relative mb-8 overflow-hidden rounded-[1.75rem] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border-[52px] border-[var(--primary)]/8" />
          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="bs-eyebrow"><Sparkles className="h-4 w-4" /> Loadout</p>
              <h1 className="bs-display mt-4">Seu inventário. <span className="text-[var(--primary)]">Suas regras.</span></h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">Monte kits CT e TR, ajuste faca, luva, música, wear e seed. O servidor sincroniza tudo quando você entra.</p>
            </div>
            {/* Vitrine 3D no lugar dos três cartões de número que ficavam
                aqui. A contagem de armas continua na linha abaixo, em texto,
                porque a informação importa — o que não precisava era de um
                cartão inteiro para cada uma. */}
            <div className="relative lg:col-span-5">
              <KnifeShowcase className="h-56 w-full sm:h-64 lg:h-[19rem]" />
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                <CountUp value={weaponEntries.length} /> armas sincronizadas
                <span className="mx-2 text-white/20">·</span>
                kits CT e TR separados
              </p>
            </div>
          </div>
        </header>

        {/* ── Kits por lado ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SideKitPanel
            side="ct"
            knifeList={knifeList}
            knife={knifeCT}
            catalog={catalog}
            skins={skinsCT}
            gloveCatalog={gloveCatalog}
            glove={gloveCT}
            musicList={musicList}
            music={musicCT}
          />
          <SideKitPanel
            side="t"
            knifeList={knifeList}
            knife={knifeT}
            catalog={catalog}
            skins={skinsT}
            gloveCatalog={gloveCatalog}
            glove={gloveT}
            musicList={musicList}
            music={musicT}
          />
        </div>

        {/* ── Armas — filtro por lado (CT, TR ou ambos) ── */}
        <WeaponsLoadout
          weapons={weaponEntries}
          currentSkinsCT={skinsCT}
          currentSkinsT={skinsT}
        />

      </div>
    </div>
  );
}
