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
  return <p className="tick mb-2.5">{children}</p>;
}

export default async function SkinsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/auth/login?next=/skins");
  }

  const pool = getWeaponPaintsPool();

  if (!pool) {
    return (
      <div className="min-h-screen bg-void">
        <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          <h1 className="font-display text-[clamp(1.875rem,3.6vw,2.75rem)] font-extrabold tracking-[-0.03em] text-ink">
            Skins
          </h1>
          <div className="mt-10 flex flex-col items-center border-t border-line/70 py-20 text-center">
            <svg viewBox="0 0 52 52" className="mb-5 h-10 w-10" aria-hidden="true">
              <circle cx="26" cy="26" r="12" fill="none" stroke="var(--color-line-2)" strokeWidth="1.5" />
              <line x1="26" y1="2" x2="26" y2="12" stroke="var(--color-line-2)" strokeWidth="1.5" />
              <line x1="26" y1="40" x2="26" y2="50" stroke="var(--color-line-2)" strokeWidth="1.5" />
              <line x1="2" y1="26" x2="12" y2="26" stroke="var(--color-line-2)" strokeWidth="1.5" />
              <line x1="40" y1="26" x2="50" y2="26" stroke="var(--color-line-2)" strokeWidth="1.5" />
            </svg>
            <p className="font-display text-base font-bold tracking-tight text-ink">
              Skins indisponíveis no momento
            </p>
            <p className="mt-1.5 text-[13px] text-ink-3">
              O servidor de personalização está em manutenção. Tente de novo em alguns minutos.
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
      <div className="min-h-screen bg-void">
        <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          <h1 className="font-display text-[clamp(1.875rem,3.6vw,2.75rem)] font-extrabold tracking-[-0.03em] text-ink">
            Skins
          </h1>
          <div className="mt-10 flex flex-col items-center border-t border-line/70 py-20 text-center">
            <svg viewBox="0 0 52 52" className="mb-5 h-10 w-10" aria-hidden="true">
              <circle cx="26" cy="26" r="12" fill="none" stroke="var(--color-line-2)" strokeWidth="1.5" />
              <line x1="26" y1="2" x2="26" y2="12" stroke="var(--color-line-2)" strokeWidth="1.5" />
              <line x1="26" y1="40" x2="26" y2="50" stroke="var(--color-line-2)" strokeWidth="1.5" />
              <line x1="2" y1="26" x2="12" y2="26" stroke="var(--color-line-2)" strokeWidth="1.5" />
              <line x1="40" y1="26" x2="50" y2="26" stroke="var(--color-line-2)" strokeWidth="1.5" />
            </svg>
            <p className="font-display text-base font-bold tracking-tight text-ink">
              Skins indisponíveis no momento
            </p>
            <p className="mt-1.5 text-[13px] text-ink-3">
              O servidor de personalização está em manutenção. Tente de novo em alguns minutos.
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
    <div className="min-h-screen bg-void">
      <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-28 sm:px-6 lg:px-8">

        <div className="mb-10">
          <h1 className="font-display text-[clamp(1.875rem,3.6vw,2.75rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink">
            Seu loadout
          </h1>
          <p className="type-body mt-4">
            Escolha faca, luva, música e skins para cada lado. Tudo é aplicado sozinho quando você
            entra num servidor BlueStrike — sem digitar comando nenhum.
          </p>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-white/[0.07] bg-abyss lg:grid-cols-2">

          {/* ── CT side ── */}
          <div className="space-y-6 border-b border-line/70 p-6 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3 border-b border-line/70 pb-4">
              <CTLogo />
              <div>
                <p className="font-display text-[15px] font-bold tracking-tight text-[#7B96FF]">Counter-Terrorist</p>
                <p className="tick mt-0.5">Kit CT</p>
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
          <div className="space-y-6 p-6">
            <div className="flex items-center gap-3 border-b border-line/70 pb-4">
              <TLogo />
              <div>
                <p className="font-display text-[15px] font-bold tracking-tight text-[#FB923C]">Terrorist</p>
                <p className="tick mt-0.5">Kit TR</p>
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
        <div className="mt-4 space-y-4 rounded-xl border border-white/[0.07] bg-abyss p-6">
          <div className="flex items-baseline gap-3 border-b border-line/70 pb-4">
            <p className="font-display text-[15px] font-bold tracking-tight text-ink">Armas</p>
            <span className="tick">Aplica nos dois lados</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
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
