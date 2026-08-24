"use client";

import CountUp from "@/components/motion/count-up";
import * as React from "react";
import Image from "next/image";
import { Check, CircleDollarSign, LoaderCircle, Radio, Server, ShieldCheck, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

function useInViewOnce<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold: 0.22, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);

  return [ref, inView] as const;
}

function usePhase(total: number, interval: number, completedPhase = total - 1, enabled = true) {
  const [phase, setPhase] = React.useState(0);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase(completedPhase);
      return;
    }
    if (!enabled) {
      setPhase(0);
      return;
    }
    setPhase(0);
    const timer = window.setInterval(() => setPhase((current) => (current + 1) % total), interval);
    return () => window.clearInterval(timer);
  }, [completedPhase, enabled, interval, total]);

  return phase;
}

const teams = [
  { tag: "LG", name: "Legacy" },
  { tag: "FX", name: "Fluxo" },
  { tag: "MIBR", name: "MIBR" },
  { tag: "IMP", name: "Imperial" },
];

function TeamRow({ tag, name, winner = false }: { tag: string; name: string; winner?: boolean }) {
  return (
    <div className={cn("flex min-h-12 items-center gap-3 border-b border-white/8 px-3.5 last:border-b-0", winner && "bg-[var(--primary)]/10")}>
      <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-white/7 px-2 font-mono text-[9px] font-black text-white/74">{tag}</span>
      <strong className={cn("text-xs text-white/62", winner && "text-white")}>{name}</strong>
      {winner && <Check className="ml-auto h-3.5 w-3.5 text-[var(--primary)]" aria-hidden="true" />}
    </div>
  );
}

function MatchSheet({ label, first, second, active, winner }: { label: string; first: typeof teams[number]; second: typeof teams[number]; active: boolean; winner?: string }) {
  return (
    <div className={cn("transition-[opacity,transform] duration-700 ease-[var(--ease-out-quint)]", active ? "translate-y-0 opacity-100" : "translate-y-1 opacity-38")}>
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.16em] text-white/42">{label}</span>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
        <TeamRow {...first} winner={winner === first.name} />
        <TeamRow {...second} winner={winner === second.name} />
      </div>
    </div>
  );
}

const cashTokens = [
  { left: "24%", delay: "0ms", color: "#f5c842" },
  { left: "42%", delay: "320ms", color: "#22c55e" },
  { left: "58%", delay: "640ms", color: "#f5c842" },
  { left: "73%", delay: "180ms", color: "#22c55e" },
];

function ChampionNode({ active }: { active: boolean }) {
  return (
    <div className={cn(
      "flex min-h-[4.5rem] items-center gap-3 rounded-2xl border bg-white/[0.035] p-3.5 transition-[opacity,transform,border-color,box-shadow] duration-700 ease-[var(--ease-out-quint)]",
      active
        ? "translate-y-0 border-[var(--primary)]/45 opacity-100 shadow-[0_14px_34px_color-mix(in_srgb,var(--primary)_10%,transparent)]"
        : "translate-y-1 border-white/8 opacity-32"
    )}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_10px_26px_color-mix(in_srgb,var(--primary)_28%,transparent)]">
        <Trophy className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-white/46">Campeã confirmada</span>
        <strong className="mt-0.5 block text-sm text-white">Legacy</strong>
      </span>
      {active && <Check className="ml-auto h-4 w-4 text-[var(--primary)]" aria-hidden="true" />}
    </div>
  );
}

function PrizeNode({ active }: { active: boolean }) {
  return (
    <div className={cn(
      "relative z-10 flex min-h-[5.75rem] items-center gap-3 rounded-2xl border bg-[#171819] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.055)] transition-[opacity,transform,border-color] duration-700 ease-[var(--ease-out-quint)]",
      active ? "translate-y-0 border-[#f5c842]/38 opacity-100" : "translate-y-1 border-white/8 opacity-30"
    )}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5c842]/12 text-[#f5c842] ring-1 ring-[#f5c842]/22">
        <CircleDollarSign className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-white/44">Prêmio da campeã</span>
        <strong className="tabular mt-1 block text-2xl font-black tracking-[-0.055em] text-white"><CountUp value={12000} prefix="R$ " /></strong>
      </span>
    </div>
  );
}

function ProcessingNode({ active, paid }: { active: boolean; paid: boolean }) {
  return (
    <div className={cn(
      "relative z-10 flex min-h-[3.4rem] items-center gap-3 rounded-xl border bg-[#171819] px-3.5 py-2.5 transition-[opacity,border-color] duration-500",
      active ? "border-green-500/26 opacity-100" : "border-white/8 opacity-28"
    )}>
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", paid ? "bg-green-500/14 text-green-400" : "bg-white/6 text-white/44")}>
        {paid ? <Check className="h-4 w-4" aria-hidden="true" /> : <LoaderCircle className={cn("h-4 w-4", active && "animate-spin")} aria-hidden="true" />}
      </span>
      <span>
        <span className="block text-[9px] uppercase tracking-[0.12em] text-white/38">Liquidação</span>
        <strong className="mt-0.5 block text-xs text-white">{paid ? "Pagamento processado" : "Processando pagamento"}</strong>
      </span>
    </div>
  );
}

function PixSentNode({ active }: { active: boolean }) {
  return (
    <div className={cn(
      "relative z-10 flex min-h-[4rem] items-center gap-3 rounded-2xl border bg-[#171819] p-3.5 transition-[opacity,transform,border-color,box-shadow] duration-700 ease-[var(--ease-out-quint)]",
      active
        ? "translate-y-0 border-green-500/38 opacity-100 shadow-[0_16px_36px_rgba(34,197,94,.1)]"
        : "translate-y-1 border-white/8 opacity-28"
    )}>
      {active && cashTokens.map((token, index) => (
        <span
          key={index}
          className="animate-cash-rise pointer-events-none absolute -top-1 font-mono text-lg font-black"
          style={{ left: token.left, color: token.color, animationDelay: token.delay }}
          aria-hidden="true"
        >
          $
        </span>
      ))}
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", active ? "bg-green-500 text-white" : "bg-white/6 text-white/40")}>
        <Check className="h-4 w-4" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-[9px] uppercase tracking-[0.12em] text-white/42">Premiação</span>
        <strong className="mt-0.5 block text-sm text-white">PIX enviado</strong>
      </span>
      <strong className="tabular ml-auto font-mono text-xs text-green-400">R$ 12.000</strong>
    </div>
  );
}

export function CompetitionPayoutFlow() {
  const [flowRef, flowInView] = useInViewOnce<HTMLDivElement>();
  // 9–12 keep the completed state on screen before the narrative restarts.
  const phase = usePhase(13, 1050, 9, flowInView);
  const bracketConnected = phase >= 4;
  const champion = phase >= 6;
  const prizeReleased = phase >= 7;
  const processing = phase >= 8;
  const paid = phase >= 9;

  return (
    <div ref={flowRef} className="relative overflow-hidden rounded-[1.75rem] bg-[#0f1011] p-5 sm:p-7 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
            <Radio className="h-3.5 w-3.5" aria-hidden="true" /> Bracket + premiação automática
          </span>
          <h3 className="mt-2 max-w-[24ch] text-2xl font-black tracking-[-0.045em] text-white sm:text-3xl">
            Da semifinal ao PIX, um único fluxo.
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/9 bg-white/[0.035] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/48">BO3</span>
          <span className={cn("rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] transition-colors duration-500", paid ? "border-green-500/28 bg-green-500/8 text-green-400" : "border-white/9 bg-white/[0.035] text-white/48")}>
            {paid ? "PIX concluído" : "Fluxo em andamento"}
          </span>
        </div>
      </div>

      <div className="mt-10 hidden h-[520px] grid-cols-[minmax(250px,1.05fr)_88px_minmax(220px,.82fr)_76px_minmax(270px,.92fr)] items-start xl:grid">
        <div className="relative h-[520px]">
          <div className="absolute inset-x-0 top-0">
            <MatchSheet label="Semifinal 01" first={teams[0]} second={teams[1]} active={phase >= 1} winner={phase >= 2 ? "Legacy" : undefined} />
          </div>
          <div className="absolute inset-x-0 top-[230px]">
            <MatchSheet label="Semifinal 02" first={teams[2]} second={teams[3]} active={phase >= 2} winner={phase >= 3 ? "Imperial" : undefined} />
          </div>
        </div>

        <svg className="h-[520px] w-full overflow-visible" viewBox="0 0 88 520" fill="none" aria-hidden="true">
          <path d="M0 66H44V181H88M0 296H44V181" stroke="rgba(255,255,255,.13)" strokeWidth="1.5" />
          <path
            d="M0 66H44V181H88M0 296H44V181"
            pathLength="1"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeDasharray="1"
            strokeDashoffset={bracketConnected ? 0 : 1}
            className="transition-[stroke-dashoffset] duration-[1200ms] ease-out"
          />
          <circle cx="44" cy="181" r="4" fill={bracketConnected ? "var(--primary)" : "rgba(255,255,255,.16)"} />
        </svg>

        <div className="relative h-[520px]">
          <div className="absolute inset-x-0 top-[115px]">
            <MatchSheet label="Grande final" first={teams[0]} second={teams[3]} active={phase >= 4} winner={phase >= 5 ? "Legacy" : undefined} />
          </div>
          <div className="absolute inset-x-0 top-[260px]">
            <ChampionNode active={champion} />
          </div>
        </div>

        <svg className="h-[520px] w-full overflow-visible" viewBox="0 0 76 520" fill="none" aria-hidden="true">
          <path d="M0 296H76" stroke="rgba(255,255,255,.13)" strokeWidth="1.5" />
          <path
            d="M0 296H76"
            pathLength="1"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeDasharray="1"
            strokeDashoffset={prizeReleased ? 0 : 1}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>

        <div className="relative h-[520px]">
          <div className="absolute inset-x-0 top-[250px]">
            <PrizeNode active={prizeReleased} />
          </div>
          <span className={cn("absolute left-1/2 top-[342px] h-7 w-px -translate-x-1/2 bg-gradient-to-b from-[#f5c842]/55 to-green-500/45 transition-opacity duration-500", processing ? "opacity-100" : "opacity-18")} aria-hidden="true" />
          <div className="absolute inset-x-0 top-[369px]">
            <ProcessingNode active={processing} paid={paid} />
          </div>
          <span className={cn("absolute left-1/2 top-[423px] h-[25px] w-px -translate-x-1/2 bg-gradient-to-b from-green-500/45 to-green-500/72 transition-opacity duration-500", paid ? "opacity-100" : "opacity-18")} aria-hidden="true" />
          <div className="absolute inset-x-0 top-[448px]">
            <PixSentNode active={paid} />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-9 max-w-2xl xl:hidden">
        <div className="grid gap-5 md:grid-cols-2">
          <MatchSheet label="Semifinal 01" first={teams[0]} second={teams[1]} active={phase >= 1} winner={phase >= 2 ? "Legacy" : undefined} />
          <MatchSheet label="Semifinal 02" first={teams[2]} second={teams[3]} active={phase >= 2} winner={phase >= 3 ? "Imperial" : undefined} />
        </div>
        <div className="mx-auto flex h-10 w-px items-center justify-center bg-gradient-to-b from-[var(--primary)] to-white/12" aria-hidden="true">
          <span className={cn("h-2.5 w-2.5 rounded-full border-2 border-[#0f1011] bg-[var(--primary)] transition-opacity", bracketConnected ? "opacity-100" : "opacity-25")} />
        </div>
        <MatchSheet label="Grande final" first={teams[0]} second={teams[3]} active={phase >= 4} winner={phase >= 5 ? "Legacy" : undefined} />
        <div className="mx-auto h-5 w-px bg-[var(--primary)]/45" aria-hidden="true" />
        <ChampionNode active={champion} />
        <div className="mx-auto h-5 w-px bg-[var(--primary)]/45" aria-hidden="true" />
        <PrizeNode active={prizeReleased} />
        <div className="mx-auto h-5 w-px bg-gradient-to-b from-[#f5c842]/55 to-green-500/45" aria-hidden="true" />
        <ProcessingNode active={processing} paid={paid} />
        <div className="mx-auto h-5 w-px bg-green-500/45" aria-hidden="true" />
        <PixSentNode active={paid} />
      </div>
    </div>
  );
}

const maps = [
  { name: "Ancient", image: "/assets/maps/ancient.jpg" },
  { name: "Anubis", image: "/assets/maps/anubis.jpg" },
  { name: "Dust II", image: "/assets/maps/dust2.jpg" },
  { name: "Inferno", image: "/assets/maps/inferno.jpg" },
  { name: "Mirage", image: "/assets/maps/mirage.jpg" },
  { name: "Nuke", image: "/assets/maps/nuke.jpg" },
  { name: "Overpass", image: "/assets/maps/overpass.webp" },
];

// O mapa que sobra no fim da sequência.
const VETO_DECIDER = "Mirage";
const VETO_STEP_MS = 620;
const VETO_TEAMS = ["Legacy", "Imperial"] as const;

/**
 * Reproduz um veto real: os X caem em ordem aleatória até sobrar um mapa.
 * A sequência roda uma vez, quando o bloco entra na tela.
 */
function useVetoSequence(active: boolean) {
  const [bannedCount, setBannedCount] = React.useState(0);
  const [order, setOrder] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!active) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pool = maps.map((m) => m.name).filter((name) => name !== VETO_DECIDER);

    // Fisher-Yates — a ordem só é sorteada no cliente, então não há
    // divergência de hidratação com o HTML do servidor.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    setOrder(pool);

    const timers = pool.map((_, index) =>
      window.setTimeout(
        () => setBannedCount(index + 1),
        reduceMotion ? 0 : 520 + index * VETO_STEP_MS
      )
    );

    return () => timers.forEach(window.clearTimeout);
  }, [active]);

  const banned = React.useMemo(
    () => new Set(order.slice(0, bannedCount)),
    [order, bannedCount]
  );

  return {
    banned,
    done: order.length > 0 && bannedCount >= order.length,
    activeTeam: VETO_TEAMS[bannedCount % 2],
  };
}

export function MapVeto() {
  const [vetoRef, vetoInView] = useInViewOnce<HTMLDivElement>();
  const { banned, done, activeTeam } = useVetoSequence(vetoInView);

  return (
    <div ref={vetoRef} className="w-full">
      <div className="mb-6 flex items-center justify-between gap-4">
        <span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-red-400">
            Veto de mapas
          </span>
          <strong className="mt-1 block text-xl tracking-[-0.035em]">
            {done ? "Mirage foi escolhido." : `Vez de ${activeTeam}.`}
          </strong>
        </span>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors duration-500",
            done
              ? "border-green-500/22 bg-green-500/8 text-green-500"
              : "border-red-400/25 bg-red-400/8 text-red-400"
          )}
        >
          {done ? (
            "Pronto"
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              Vetando
            </span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
        {maps.map((map, index) => {
          const isBanned = banned.has(map.name);
          const isPicked = done && map.name === VETO_DECIDER;

          return (
            <div
              key={map.name}
              className={cn(
                "relative min-h-48 overflow-hidden rounded-2xl border transition-[opacity,transform,border-color,box-shadow] duration-700 ease-[var(--ease-out-quint)] lg:min-h-56",
                vetoInView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
                isPicked
                  ? "border-green-500/48 shadow-[0_16px_30px_rgba(34,197,94,.09)]"
                  : "border-[var(--border)]"
              )}
              style={{ transitionDelay: vetoInView ? `${index * 85}ms` : "0ms" }}
            >
              <Image
                src={map.image}
                alt=""
                fill
                sizes="160px"
                className={cn(
                  "object-cover transition-[filter,opacity] duration-500",
                  isBanned ? "opacity-32 saturate-50" : "opacity-90 saturate-110"
                )}
              />
              <span
                className={cn(
                  "absolute inset-0 transition-colors duration-500",
                  isBanned ? "bg-black/58" : "bg-black/12"
                )}
              />

              {/* X do veto */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 h-full w-full transition-[opacity,transform] duration-300 ease-[var(--ease-out-quint)]",
                  isBanned ? "scale-100 opacity-100" : "scale-125 opacity-0"
                )}
              >
                <line x1="12" y1="12" x2="88" y2="88" stroke="rgb(248 113 113 / .85)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                <line x1="88" y1="12" x2="12" y2="88" stroke="rgb(248 113 113 / .85)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
              </svg>

              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent px-1 pb-3 pt-10 text-center text-[10px] font-bold transition-colors duration-500",
                  isBanned ? "text-white/45 line-through" : "text-white/86"
                )}
              >
                {map.name}
              </span>

              {isPicked && (
                <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-green-500/35 bg-green-500/15 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-green-400 backdrop-blur-sm">
                  Decider
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SkinsUnlocked() {
  return (
    <div className="relative min-h-[20rem] w-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111]">
      <Image src="/assets/banner_bluestrike_home.png" alt="Servidor BlueStrike com coleção de skins liberadas" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover object-right opacity-[.82] saturate-110" />
      <span className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/52 to-black/5" />
      <div className="relative flex min-h-[20rem] max-w-md flex-col justify-between p-6 sm:p-7">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-black/42 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/72 backdrop-blur-sm"><Server className="h-3.5 w-3.5 text-[var(--primary)]" /> Servidor BlueStrike</span>
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-[var(--primary)]/32 bg-black/52 px-3 py-2 font-mono text-xl font-black text-[var(--primary)] backdrop-blur-sm">!ws • !wp</span>
          <span><strong className="block text-white">Skins liberadas</strong><span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-green-400"><ShieldCheck className="h-3.5 w-3.5" /> Configuração aplicada</span></span>
        </div>
      </div>
    </div>
  );
}
