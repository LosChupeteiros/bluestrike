import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Radio, Trophy, Users } from "lucide-react";
import { listTournaments } from "@/lib/tournaments";
import { getFaceitChampionships } from "@/lib/faceit";

type Campaign = {
  id: string;
  href: string;
  name: string;
  status: "open" | "ongoing" | "upcoming" | "faceit";
  statusLabel: string;
  prize: number;
  meta: string;
  image: string;
};

const statusClass = {
  open: "border-green-400/30 bg-green-500/15 text-green-300",
  ongoing: "border-[var(--primary)]/30 bg-[var(--primary)]/15 text-[var(--primary)]",
  upcoming: "border-white/15 bg-white/10 text-white/70",
  faceit: "border-orange-400/30 bg-orange-500/15 text-orange-300",
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
      // Campeonato finalizado sai da vitrine — vai só para a aba de finalizados.
      ...tournaments
        .filter((t) => t.status !== "finished")
        .map((t): Campaign => ({
          id: t.id,
          href: `/tournaments/${t.id}`,
          name: t.name,
          status: t.status as "open" | "ongoing" | "upcoming",
          statusLabel:
            t.status === "open"
              ? "Inscrições abertas"
              : t.status === "ongoing"
                ? "Em andamento"
                : "Em breve",
          prize: t.prizeTotal,
          meta:
            t.status === "open"
              ? `${t.registeredTeamsCount ?? 0}/${t.maxTeams} vagas`
              : t.status === "ongoing"
                ? "Em disputa"
                : t.startsAt
                  ? `Início ${new Date(t.startsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
                  : "Em preparação",
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
        const order = { open: 0, ongoing: 1, faceit: 2, upcoming: 3 };
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={campaign.href}
              data-reveal-item
              className="bs-interactive bs-press group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              {/* Banner inteiro: `contain` em vez de `cover` para não cortar a arte */}
              <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-[#06090d]">
                {/* Fundo desfocado preenche as sobras sem cortar o banner */}
                <Image
                  src={campaign.image}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 100vw, 33vw"
                  aria-hidden="true"
                  className="scale-110 object-cover opacity-25 blur-2xl"
                />
                <Image
                  src={campaign.image}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 100vw, 33vw"
                  className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>

              {/* Conteúdo abaixo do risco */}
              <div className="flex flex-1 flex-col border-t border-[var(--border)] p-5">
                <h3 className="line-clamp-2 text-2xl font-black uppercase leading-[1.05] tracking-[-0.04em] transition-colors group-hover:text-[var(--primary)] sm:text-[1.7rem]">
                  {campaign.name}
                </h3>

                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <div>
                    <div className="tabular font-mono text-2xl font-black leading-none tracking-[-0.04em] text-[#f5c842]">
                      {formatPrize(campaign.prize)}
                    </div>
                    <div className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#f5c842]/60">
                      Prêmio total no PIX
                    </div>
                  </div>

                  {/* Status em cima das vagas, alinhado à direita */}
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${statusClass[campaign.status]}`}
                    >
                      {campaign.status === "ongoing" && (
                        <Radio className="mr-1 inline h-3 w-3 animate-pulse" aria-hidden="true" />
                      )}
                      {campaign.statusLabel}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--muted-foreground)]">
                      <Users className="h-3 w-3" aria-hidden="true" />
                      {campaign.meta}
                    </span>
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
