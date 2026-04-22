import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/profiles";
import { getWeaponPaintsPool } from "@/lib/weaponpaints/mysql";
import { getCurrentSkins, getCurrentKnife } from "@/lib/weaponpaints/queries";
import { getSkinsByWeapon, getWeaponList, getKnifeList } from "@/lib/weaponpaints/catalog";
import { WeaponCard } from "./components/weapon-card";
import { KnifeCard } from "./components/knife-card";

export const metadata: Metadata = {
  title: "Skins",
  description: "Escolha suas skins para o servidor BlueStrike.",
};

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

  const [currentSkins, currentKnife] = await Promise.all([
    getCurrentSkins(pool, profile.steamId),
    getCurrentKnife(pool, profile.steamId),
  ]);

  const catalog = getSkinsByWeapon();
  const weaponList = getWeaponList();
  const knifeList = getKnifeList();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight">Skins</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Escolha suas skins. São aplicadas automaticamente quando você entra no servidor BlueStrike.
          </p>
        </div>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
            Faca
          </p>
          <KnifeCard
            knifeList={knifeList}
            currentKnifeWeaponName={currentKnife}
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
            Armas
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Object.entries(weaponList).map(([defindexStr, defaultSkin]) => {
              const defindex = Number(defindexStr);
              const availableSkins = catalog[defindex] ?? {};
              const currentSkin = currentSkins[defindex] ?? null;

              return (
                <WeaponCard
                  key={defindex}
                  defindex={defindex}
                  defaultSkin={defaultSkin}
                  availableSkins={availableSkins}
                  currentSkin={currentSkin}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
