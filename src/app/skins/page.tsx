import { redirect } from "next/navigation";
import type { Metadata } from "next";
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
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight">Skins</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Escolha suas skins para cada lado. São aplicadas automaticamente quando você entra no servidor.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-xl border border-[var(--border)] overflow-hidden">

          {/* ── CT side ── */}
          <div className="border-b border-[var(--border)] lg:border-b-0 lg:border-r p-5 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
              <CTLogo />
              <div>
                <p className="text-base font-black tracking-tight text-[#7B96FF]">Counter-Terrorist</p>
                <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest">Kit CT</p>
              </div>
            </div>

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

          {/* ── T side ── */}
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
              <TLogo />
              <div>
                <p className="text-base font-black tracking-tight text-[#FB923C]">Terrorist</p>
                <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest">Kit TR</p>
              </div>
            </div>

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

        {/* ── Armas (unificado — aplica em ambos os lados) ── */}
        <div className="mt-4 rounded-xl border border-[var(--border)] p-5 space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
            <p className="text-base font-black tracking-tight">Armas</p>
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest">CT &amp; TR</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
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
