import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/profiles";
import { getWeaponPaintsPool } from "@/lib/weaponpaints/mysql";
import { getCurrentSkins, getCurrentKnife, getCurrentGlove, getCurrentMusic } from "@/lib/weaponpaints/queries";
import { getSkinsByWeapon, getWeaponList, getKnifeList, getGloveCatalog, getMusicList } from "@/lib/weaponpaints/catalog";
import { WeaponCard } from "./components/weapon-card";
import { KnifeCard } from "./components/knife-card";
import { GloveCard } from "./components/glove-card";
import { MusicCard } from "./components/music-card";

export const metadata: Metadata = {
  title: "Skins",
  description: "Escolha suas skins para o servidor BlueStrike.",
};

function CTLogo() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="22,3 40,12.5 40,31.5 22,41 4,31.5 4,12.5"
        fill="#4B69FF"
        fillOpacity="0.12"
        stroke="#4B69FF"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <polygon
        points="22,9 35,16.5 35,29.5 22,37 9,29.5 9,16.5"
        fill="#4B69FF"
        fillOpacity="0.07"
        stroke="#4B69FF"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <text
        x="22"
        y="27"
        textAnchor="middle"
        fill="#7B96FF"
        fontSize="12"
        fontWeight="900"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        letterSpacing="0.5"
      >
        CT
      </text>
    </svg>
  );
}

function TLogo() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="18" fill="#F97316" fillOpacity="0.12" stroke="#F97316" strokeWidth="1.5" />
      <circle cx="22" cy="22" r="12" fill="#F97316" fillOpacity="0.07" stroke="#F97316" strokeWidth="0.75" />
      <text
        x="22"
        y="27"
        textAnchor="middle"
        fill="#FB923C"
        fontSize="12"
        fontWeight="900"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        letterSpacing="0.5"
      >
        TR
      </text>
    </svg>
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
  ]).catch(() => null);

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

            <div>
              <SectionLabel>Armas</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                {weaponEntries.map(({ defindex, defaultSkin, availableSkins }) => (
                  <WeaponCard
                    key={defindex}
                    defindex={defindex}
                    defaultSkin={defaultSkin}
                    availableSkins={availableSkins}
                    currentSkin={skinsCT[defindex] ?? null}
                    team={3}
                  />
                ))}
              </div>
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

            <div>
              <SectionLabel>Armas</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                {weaponEntries.map(({ defindex, defaultSkin, availableSkins }) => (
                  <WeaponCard
                    key={defindex}
                    defindex={defindex}
                    defaultSkin={defaultSkin}
                    availableSkins={availableSkins}
                    currentSkin={skinsT[defindex] ?? null}
                    team={2}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
