import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Radio, Trophy } from "lucide-react";
import { listTournaments } from "@/lib/tournaments";
import { getFaceitChampionships } from "@/lib/faceit";

type Campaign = {
  id: string;
  href: string;
  name: string;
  status: "open" | "ongoing" | "upcoming" | "finished" | "faceit";
  statusLabel: string;
  prize: number;
  meta: string;
  image: string;
};

const statusClass = {
  open: "bg-emerald-500 text-white",
  ongoing: "bg-blue-500 text-white",
  upcoming: "bg-white/15 text-white",
  finished: "bg-white/15 text-white",
  faceit: "bg-[#f05a16] text-white",
} as const;

function moneyFromCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export default async function FeaturedTournaments() {
  let campaigns: Campaign[] = [];
  let hasError = false;

  try {
    const [tournaments, faceit] = await Promise.all([
      listTournaments({ status: "all" }),
      getFaceitChampionships(),
    ]);

    campaigns = [
      ...tournaments.map((t): Campaign => ({
        id: t.id,
        href: `/tournaments/${t.id}`,
        name: t.name,
        status: t.status,
        statusLabel: t.status === "open" ? "Inscrições abertas" : t.status === "ongoing" ? "Em andamento" : t.status === "upcoming" ? "Em breve" : "Finalizado",
        prize: t.prizeTotal,
        meta: t.status === "open"
          ? `${t.registeredTeamsCount ?? 0}/${t.maxTeams} vagas`
          : t.status === "ongoing" ? "Campeonato em disputa" : t.startsAt ? `Início ${new Date(t.startsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}` : "Acompanhe os detalhes",
        image: t.bannerUrl || "/assets/banner_bluestrike_home.png",
      })),
      ...faceit.map((c): Campaign => ({
        id: `faceit-${c.id}`,
        href: `/tournaments/faceit-${c.id}`,
        name: c.name,
        status: "faceit",
        statusLabel: c.status === "ongoing" ? "Ao vivo" : "FACEIT",
        prize: c.totalPrizes,
        meta: `${c.currentSubscriptions}/${c.slots} times`,
        image: c.coverImage || c.backgroundImage || "/assets/banner_faceit_home.png",
      })),
    ]
      .sort((a, b) => {
        const order = { open: 0, ongoing: 1, faceit: 2, upcoming: 3, finished: 4 };
        return order[a.status] - order[b.status];
      })
      .slice(0, 3);
  } catch {
    hasError = true;
  }

  return (
    <section className="bs-page-shell pb-12 pt-24 md:pb-20 md:pt-28">
      <div className="mb-8 flex items-end justify-between gap-5">
        <div>
          <h2 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Campeonatos abertos</h2>
          <p className="mt-2 text-[var(--muted-foreground)]">Escolha sua próxima disputa e acompanhe o circuito.</p>
        </div>
        <Link href="/tournaments" className="hidden items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline sm:flex">
          Ver todos <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {hasError ? (
        <div className="bs-panel px-6 py-8 text-sm text-[var(--muted-foreground)]">
          Não foi possível carregar os campeonatos agora. Tente novamente em instantes.
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bs-panel flex min-h-48 items-center gap-4 px-6 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
            <Trophy className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold">Novos campeonatos em preparação</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Assim que uma disputa for publicada, ela aparecerá aqui.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-flow-dense grid-cols-1 gap-4 md:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={campaign.href}
              className="group relative min-h-[290px] overflow-hidden rounded-2xl bg-[var(--brand-navy)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            >
              <Image
                src={campaign.image}
                alt=""
                fill
                sizes="(max-width: 767px) 100vw, 33vw"
                className="bs-campaign-image object-cover opacity-70 transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,15,33,.12),rgba(4,15,33,.94))]" />
              <div className="relative flex min-h-[290px] flex-col justify-between p-6">
                <span className={`w-fit rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${statusClass[campaign.status]}`}>
                  {campaign.statusLabel}
                </span>
                <div>
                  <h3 className="max-w-[16ch] text-2xl font-bold uppercase leading-[1.02] tracking-[-0.03em] text-white">
                    {campaign.name}
                  </h3>
                  <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/15 pt-4">
                    <div>
                      <div className="font-mono text-xl font-bold text-white">{moneyFromCents(campaign.prize)}</div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/65">Prêmio total</div>
                    </div>
                    <div className="flex items-center gap-2 text-right text-xs font-medium text-white/80">
                      {campaign.status === "ongoing" && <Radio className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />}
                      {campaign.meta}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
