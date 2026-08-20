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
  open: "border-green-400/25 bg-green-500/15 text-green-300",
  ongoing: "border-[var(--primary)]/25 bg-[var(--primary)]/15 text-[var(--primary)]",
  upcoming: "border-white/15 bg-white/10 text-white/70",
  finished: "border-white/15 bg-white/10 text-white/70",
  faceit: "border-orange-400/25 bg-orange-500/15 text-orange-300",
} as const;

function formatPrize(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
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
        statusLabel:
          t.status === "open"
            ? "Inscrições abertas"
            : t.status === "ongoing"
              ? "Em andamento"
              : t.status === "upcoming"
                ? "Em breve"
                : "Finalizado",
        prize: t.prizeTotal,
        meta:
          t.status === "open"
            ? `${t.registeredTeamsCount ?? 0}/${t.maxTeams} vagas`
            : t.status === "ongoing"
              ? "Campeonato em disputa"
              : t.startsAt
                ? `Início ${new Date(t.startsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
                : "Acompanhe os detalhes",
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
    <section className="bs-shell bs-section" data-reveal>
      <div className="mb-10 flex items-end justify-between gap-5">
        <div>
          <p className="bs-eyebrow">Agora na plataforma</p>
          <h2 className="type-h2 mt-4">Campeonatos abertos</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">Escolha a próxima disputa do seu time.</p>
        </div>
        <Link href="/tournaments" className="hidden items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:text-white sm:flex">
          Ver todos <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {hasError ? (
        <div className="bs-panel px-6 py-8 text-sm text-[var(--muted-foreground)]">
          Não foi possível carregar os campeonatos agora.
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bs-panel flex min-h-48 items-center gap-4 px-6 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
            <Trophy className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold">Novos campeonatos em preparação</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">As próximas disputas aparecerão aqui assim que forem publicadas.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-flow-dense grid-cols-1 gap-4 md:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={campaign.href}
              className="bs-dark-card group relative min-h-[360px] overflow-hidden text-white transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <Image
                src={campaign.image}
                alt=""
                fill
                sizes="(max-width: 767px) 100vw, 33vw"
                className="object-cover opacity-52 transition-[transform,opacity] duration-700 ease-out group-hover:scale-[1.035] group-hover:opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/45 to-black" />
              <div className="relative flex min-h-[360px] flex-col justify-between p-6 sm:p-7">
                <span className={`w-fit rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] ${statusClass[campaign.status]}`}>
                  {campaign.statusLabel}
                </span>
                <div className="flex min-h-[12rem] flex-col justify-end">
                  <h3 className="flex min-h-[4rem] max-w-[17ch] items-end text-2xl font-black uppercase leading-[1.02] tracking-[-0.04em] text-white sm:text-3xl">
                    {campaign.name}
                  </h3>
                  <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/15 pt-4">
                    <div>
                      <div className="tabular text-2xl font-black tracking-[-0.04em] text-white">{formatPrize(campaign.prize)}</div>
                      <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">
                        Prêmio total no PIX
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right text-xs font-medium text-white/70">
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
