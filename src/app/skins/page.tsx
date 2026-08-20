import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CloudCog, Gamepad2, Sparkles, Zap } from "lucide-react";
import { getCurrentProfile } from "@/lib/profiles";
import { getWeaponPaintsPool } from "@/lib/weaponpaints/mysql";
import { getCurrentSkins, getCurrentKnife, getCurrentGlove, getCurrentMusic } from "@/lib/weaponpaints/queries";
import { getSkinsByWeapon, getWeaponList, getKnifeList, getGloveCatalog, getMusicList } from "@/lib/weaponpaints/catalog";
import { KnifeCard } from "./components/knife-card";
import { GloveCard } from "./components/glove-card";
import { MusicCard } from "./components/music-card";
import { WeaponCardUnified } from "./components/weapon-card-unified";

export const metadata: Metadata = {
  title: "Skins",
  description: "Escolha suas skins para o servidor BlueStrike.",
};

function CTLogo() {
  return (
    <span
      aria-label="CT"
      className="flex h-11 w-11 items-center justify-center bg-contain bg-center bg-no-repeat text-xs font-black text-[#7B96FF]"
      style={{ backgroundImage: "url(/assets/sides/Ct_logo.webp)" }}
    >
      CT
    </span>
  );
}

function TLogo() {
  return (
    <span
      aria-label="TR"
      className="flex h-11 w-11 items-center justify-center bg-contain bg-center bg-no-repeat text-xs font-black text-[#FB923C]"
      style={{ backgroundImage: "url(/assets/sides/Tr_logo.webp)" }}
    >
      TR
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
      {children}
    </p>
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
            <div className="bs-inset grid gap-3 p-3 sm:grid-cols-3 lg:col-span-5">
              <div className="bs-dark-card p-4"><Gamepad2 className="h-4 w-4 text-[#7b96ff]" /><strong className="mt-5 block font-mono text-2xl">CT</strong><span className="text-[9px] uppercase tracking-[0.14em] text-white/45">Kit dedicado</span></div>
              <div className="bs-dark-card p-4"><Zap className="h-4 w-4 text-[#fb923c]" /><strong className="mt-5 block font-mono text-2xl">TR</strong><span className="text-[9px] uppercase tracking-[0.14em] text-white/45">Kit dedicado</span></div>
              <div className="bs-dark-card p-4"><CloudCog className="h-4 w-4 text-[var(--primary)]" /><strong className="mt-5 block font-mono text-2xl">{weaponEntries.length}</strong><span className="text-[9px] uppercase tracking-[0.14em] text-white/45">Armas sincronizadas</span></div>
            </div>
          </div>
        </header>

        <div className="bs-bento-card grid grid-cols-1 overflow-hidden lg:grid-cols-2">

          {/* ── CT side ── */}
          <div className="space-y-5 border-b border-[var(--border)] p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
              <CTLogo />
              <div>
                <p className="text-base font-black tracking-tight text-[#7B96FF]">Counter-Terrorist</p>
                <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest">Kit CT</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div>
              <SectionLabel>Faca</SectionLabel>
              <KnifeCard
                knifeList={knifeList}
                currentKnifeWeaponName={knifeCT}
                skinCatalog={catalog}
                currentSkins={skinsCT}
                team={3}
              />
            </div>

            <div>
              <SectionLabel>Luvas</SectionLabel>
              <GloveCard
                gloveCatalog={gloveCatalog}
                currentGlove={gloveCT}
                currentSkins={skinsCT}
                team={3}
              />
            </div>

            <div>
              <SectionLabel>Kit de Música</SectionLabel>
              <MusicCard musicList={musicList} currentMusicId={musicCT} team={3} />
            </div>
            </div>
          </div>

          {/* ── T side ── */}
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
              <TLogo />
              <div>
                <p className="text-base font-black tracking-tight text-[#FB923C]">Terrorist</p>
                <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest">Kit TR</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div>
              <SectionLabel>Faca</SectionLabel>
              <KnifeCard
                knifeList={knifeList}
                currentKnifeWeaponName={knifeT}
                skinCatalog={catalog}
                currentSkins={skinsT}
                team={2}
              />
            </div>

            <div>
              <SectionLabel>Luvas</SectionLabel>
              <GloveCard
                gloveCatalog={gloveCatalog}
                currentGlove={gloveT}
                currentSkins={skinsT}
                team={2}
              />
            </div>

            <div>
              <SectionLabel>Kit de Música</SectionLabel>
              <MusicCard musicList={musicList} currentMusicId={musicT} team={2} />
            </div>
            </div>
          </div>

        </div>

        {/* ── Armas (unificado — aplica em ambos os lados) ── */}
        <div className="bs-bento-card mt-6 space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
            <p className="text-base font-black tracking-tight">Armas</p>
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest">CT &amp; TR</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {weaponEntries.map(({ defindex, defaultSkin, availableSkins }) => (
              <WeaponCardUnified
                key={defindex}
                defindex={defindex}
                defaultSkin={defaultSkin}
                availableSkins={availableSkins}
                currentSkin={skinsCT[defindex] ?? null}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
