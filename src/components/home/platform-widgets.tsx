"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Cada widget é uma folha memoizada com seu próprio timer. Nada aqui
 * re-renderiza o bento em volta, então o grid segura as animações perpétuas
 * sem perder frame.
 */

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/** Relógio de fases compartilhado pelas animações em loop. */
function usePhase(total: number, intervalMs: number, restIndex = total - 1) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = React.useState(restIndex);

  React.useEffect(() => {
    if (reduced) return;
    setPhase(0);
    const id = window.setInterval(() => {
      setPhase((current) => (current + 1) % total);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [reduced, total, intervalMs]);

  return phase;
}

// ═════════════════════════════════════════════════════════════════════════════
// CHAVEAMENTO
// ═════════════════════════════════════════════════════════════════════════════

/** Nomes com cara de org brasileira, não de placeholder. */
const QUARTERS = [
  { top: "CANGAÇO", bottom: "GAROA", winner: 0 },
  { top: "TUPÃ", bottom: "VÓRTEX", winner: 0 },
  { top: "ÓRION", bottom: "ARRANCA", winner: 0 },
  { top: "MALTA", bottom: "ZÊNITE", winner: 1 },
];

const ROW_H = 20;
const BOX_W = 108;
const PAIR_GAP = 26;

/** Centros derivados, para as três colunas ficarem sempre alinhadas entre si. */
const QF_Y = [0, 1, 2, 3].map((i) => 26 + i * (ROW_H * 2 + PAIR_GAP));
const SF_Y = [(QF_Y[0] + QF_Y[1]) / 2, (QF_Y[2] + QF_Y[3]) / 2];
const FINAL_Y = (SF_Y[0] + SF_Y[1]) / 2;

const COL_X = { qf: 6, sf: 158, final: 310 };
const BASELINE = QF_Y[3] + ROW_H + 22;

/* 0 ocioso · 1 quartas · 2 semis aparecem · 3 semis decididas + final aparece
   · 4 campeão · 5-8 comemoração. O campeão fica ~7,5s antes de reiniciar. */
const TOTAL_PHASES = 9;

/** Cifrões com posição, tamanho e atraso variados — evita cadência mecânica. */
const CASH_BURST = [
  { x: 54, size: 15, delay: 0, opacity: 1 },
  { x: 8, size: 11, delay: 420, opacity: 0.8 },
  { x: 100, size: 12, delay: 760, opacity: 0.85 },
  { x: 30, size: 10, delay: 1180, opacity: 0.7 },
  { x: 78, size: 13, delay: 1560, opacity: 0.8 },
  { x: 54, size: 10, delay: 2000, opacity: 0.6 },
];

function MatchBox({
  x,
  centerY,
  top,
  bottom,
  winner,
  revealed,
  decided,
  champion,
}: {
  x: number;
  centerY: number;
  top: string;
  bottom: string;
  winner: number;
  revealed: boolean;
  decided: boolean;
  champion?: boolean;
}) {
  const y = centerY - ROW_H;
  const accent = champion ? "var(--color-prize)" : "var(--color-strike)";

  return (
    <g>
      {[0, 1].map((row) => {
        const isWinner = decided && winner === row;
        const label = revealed ? (row === 0 ? top : bottom) : "—";
        const rowY = y + row * ROW_H;

        return (
          <g key={row}>
            <rect
              x={x}
              y={rowY}
              width={BOX_W}
              height={ROW_H}
              rx={3}
              fill={
                isWinner
                  ? `color-mix(in oklab, ${accent} ${champion ? 24 : 15}%, transparent)`
                  : "var(--color-surface)"
              }
              stroke={isWinner ? `color-mix(in oklab, ${accent} 55%, transparent)` : "var(--color-line)"}
              strokeWidth={1}
              style={{ transition: "fill 600ms var(--ease-out-quint), stroke 600ms var(--ease-out-quint)" }}
            />
            <text
              x={x + 9}
              y={rowY + ROW_H / 2 + 3.2}
              fontSize={9}
              fontWeight={isWinner ? 700 : 500}
              fontFamily="var(--font-display)"
              letterSpacing="0.02em"
              fill={
                isWinner
                  ? accent
                  : revealed
                    ? decided
                      ? "var(--color-ink-3)"
                      : "var(--color-ink-2)"
                    : "var(--color-line-2)"
              }
              style={{ transition: "fill 600ms var(--ease-out-quint)" }}
            >
              {label}
            </text>

            <circle
              cx={x + BOX_W - 9}
              cy={rowY + ROW_H / 2}
              r={2}
              fill={accent}
              style={{ opacity: isWinner ? 1 : 0, transition: "opacity 600ms var(--ease-out-quint)" }}
            />
          </g>
        );
      })}
    </g>
  );
}

function Cable({
  fromX,
  fromY,
  toX,
  toY,
  live,
  delay = 0,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  live: boolean;
  delay?: number;
}) {
  const midX = fromX + (toX - fromX) / 2;
  const d = `M${fromX} ${fromY} H${midX} V${toY} H${toX}`;
  const length = midX - fromX + Math.abs(toY - fromY) + (toX - midX) + 4;

  return (
    <>
      <path d={d} fill="none" stroke="var(--color-line)" strokeWidth={1.1} />
      <path
        d={d}
        fill="none"
        stroke="var(--color-strike)"
        strokeWidth={1.5}
        strokeLinecap="round"
        style={{
          strokeDasharray: length,
          strokeDashoffset: live ? 0 : length,
          transition: `stroke-dashoffset 900ms var(--ease-out-quint) ${delay}ms`,
        }}
      />
    </>
  );
}

function BracketFlowImpl() {
  const phase = usePhase(TOTAL_PHASES, 1500, 4);

  const qfDecided = phase >= 1;
  const sfRevealed = phase >= 2;
  const sfDecided = phase >= 3;
  const finalRevealed = phase >= 3;
  const finalDecided = phase >= 4;

  const rounds = [
    { x: COL_X.qf, label: "Quartas" },
    { x: COL_X.sf, label: "Semifinal" },
    { x: COL_X.final, label: "Final" },
  ];

  return (
    <svg
      viewBox={`0 0 ${COL_X.final + BOX_W + 6} ${BASELINE + 6}`}
      className="h-full w-full"
      role="img"
      aria-label="Chaveamento avançando automaticamente rodada a rodada"
    >
      {QUARTERS.map((_, index) => (
        <Cable
          key={`qf-${index}`}
          fromX={COL_X.qf + BOX_W}
          fromY={QF_Y[index]}
          toX={COL_X.sf}
          toY={SF_Y[Math.floor(index / 2)]}
          live={qfDecided}
          delay={index * 70}
        />
      ))}

      {SF_Y.map((y, index) => (
        <Cable
          key={`sf-${index}`}
          fromX={COL_X.sf + BOX_W}
          fromY={y}
          toX={COL_X.final}
          toY={FINAL_Y}
          live={sfDecided}
          delay={index * 90}
        />
      ))}

      {QUARTERS.map((match, index) => (
        <MatchBox
          key={`qfbox-${index}`}
          x={COL_X.qf}
          centerY={QF_Y[index]}
          top={match.top}
          bottom={match.bottom}
          winner={match.winner}
          revealed
          decided={qfDecided}
        />
      ))}

      <MatchBox
        x={COL_X.sf}
        centerY={SF_Y[0]}
        top="CANGAÇO"
        bottom="TUPÃ"
        winner={0}
        revealed={sfRevealed}
        decided={sfDecided}
      />
      <MatchBox
        x={COL_X.sf}
        centerY={SF_Y[1]}
        top="ÓRION"
        bottom="ZÊNITE"
        winner={1}
        revealed={sfRevealed}
        decided={sfDecided}
      />

      <MatchBox
        x={COL_X.final}
        centerY={FINAL_Y}
        top="CANGAÇO"
        bottom="ZÊNITE"
        winner={0}
        revealed={finalRevealed}
        decided={finalDecided}
        champion
      />

      {/* Chuva de cifrões quando a final fecha */}
      {finalDecided && (
        <g aria-hidden="true">
          {CASH_BURST.map((cash, index) => (
            <text
              key={index}
              x={COL_X.final + cash.x}
              y={FINAL_Y - ROW_H - 6}
              textAnchor="middle"
              fontSize={cash.size}
              fontWeight={800}
              fontFamily="var(--font-display)"
              fill="var(--color-prize)"
              className="animate-cash-rise"
              style={{ animationDelay: `${cash.delay}ms`, opacity: cash.opacity }}
            >
              R$
            </text>
          ))}
        </g>
      )}

      {/* Rótulos de rodada — mesma linha de base para as três colunas */}
      {rounds.map((round) => (
        <text
          key={round.label}
          x={round.x}
          y={BASELINE}
          fontSize={9}
          fontWeight={600}
          fontFamily="var(--font-display)"
          fill="var(--color-ink-3)"
        >
          {round.label}
        </text>
      ))}
    </svg>
  );
}

export const BracketFlow = React.memo(BracketFlowImpl);

// ═════════════════════════════════════════════════════════════════════════════
// PIX
// ═════════════════════════════════════════════════════════════════════════════

function PixPayoutImpl() {
  const phase = usePhase(6, 1150, 5);
  const sending = phase >= 1;
  const arrived = phase >= 2;
  const confirmed = phase >= 3;

  return (
    <div className="flex w-full flex-col justify-center gap-6">
      {/* leading-none cortava os ascendentes do numeral; 1.05 dá folga */}
      <div className="relative flex items-baseline gap-1.5">
        <span className="font-display text-base font-bold text-prize">R$</span>
        <span className="tabular text-[2.25rem] font-bold leading-[1.05] text-ink">4.800</span>

      </div>

      {/* Origem → destino, com as pontas nomeadas: fica explícito para quem vai */}
      <div>
        <div className="flex items-center">
          <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-surface">
            <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true">
              <path
                d="M4 15V7l5-4 5 4v8"
                fill="none"
                stroke="var(--color-ink-2)"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path d="M7.5 15v-4h3v4" fill="none" stroke="var(--color-ink-2)" strokeWidth="1.4" />
            </svg>
          </span>

          <span className="relative mx-3 h-px flex-1 bg-line">
            <span
              className="absolute inset-y-0 left-0 bg-prize"
              style={{ width: sending ? "100%" : "0%", transition: "width 850ms var(--ease-out-quint)" }}
            />
            <span
              className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-void px-1 font-display text-[10px] font-bold text-prize"
              style={{
                left: sending ? "100%" : "0%",
                transform: "translate(-50%, -50%)",
                opacity: sending && !arrived ? 1 : 0,
                transition: "left 850ms var(--ease-out-quint), opacity 250ms linear",
              }}
              aria-hidden="true"
            >
              R$
            </span>
          </span>

          <span
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-500"
            style={{
              borderColor: arrived
                ? "color-mix(in oklab, var(--color-gain) 50%, transparent)"
                : "var(--color-line)",
              background: arrived
                ? "color-mix(in oklab, var(--color-gain) 14%, transparent)"
                : "var(--color-surface)",
            }}
          >
            {confirmed && (
              <span
                className="animate-cash-rise pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 font-display text-[13px] font-bold text-prize"
                aria-hidden="true"
              >
                +R$
              </span>
            )}

            {/* Capitão do time — o destino do PIX */}
            <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true">
              <circle
                cx="9"
                cy="6.2"
                r="2.8"
                fill="none"
                stroke={arrived ? "var(--color-gain)" : "var(--color-ink-3)"}
                strokeWidth="1.4"
                style={{ transition: "stroke 400ms linear" }}
              />
              <path
                d="M3.6 15c.5-3 2.7-4.4 5.4-4.4s4.9 1.4 5.4 4.4"
                fill="none"
                stroke={arrived ? "var(--color-gain)" : "var(--color-ink-3)"}
                strokeWidth="1.4"
                strokeLinecap="round"
                style={{ transition: "stroke 400ms linear" }}
              />
            </svg>
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-display text-xs font-semibold text-ink-3">Fim do campeonato</span>
          <span
            className="font-display text-xs font-bold transition-colors duration-500"
            style={{ color: confirmed ? "var(--color-gain)" : "var(--color-ink-3)" }}
          >
            {confirmed ? "Na chave do capitão" : "Chave do capitão"}
          </span>
        </div>
      </div>
    </div>
  );
}

export const PixPayout = React.memo(PixPayoutImpl);

// ═════════════════════════════════════════════════════════════════════════════
// VETO — com as splash arts dos mapas, igual ao veto real dos campeonatos
// ═════════════════════════════════════════════════════════════════════════════

const MAPS = [
  { name: "Ancient", image: "/assets/maps/ancient.jpg" },
  { name: "Anubis", image: "/assets/maps/anubis.jpg" },
  { name: "Dust II", image: "/assets/maps/dust2.jpg" },
  { name: "Inferno", image: "/assets/maps/inferno.jpg" },
  { name: "Mirage", image: "/assets/maps/mirage.jpg" },
  { name: "Nuke", image: "/assets/maps/nuke.jpg" },
  { name: "Overpass", image: "/assets/maps/overpass.webp" },
];

const BAN_ORDER = [2, 6, 0, 5, 1, 3];

function MapVetoImpl() {
  const phase = usePhase(BAN_ORDER.length + 3, 780, BAN_ORDER.length);
  const bannedSet = new Set(BAN_ORDER.slice(0, Math.min(phase, BAN_ORDER.length)));
  const decided = phase >= BAN_ORDER.length;

  return (
    <div className="grid h-full w-full grid-cols-7 gap-2">
      {MAPS.map((map, index) => {
        const isBanned = bannedSet.has(index);
        const isPick = decided && !isBanned;

        return (
          <div
            key={map.name}
            className={cn(
              "relative h-full min-h-[7rem] overflow-hidden rounded-lg border",
              "transition-all duration-500 [transition-timing-function:var(--ease-out-quint)]",
              isPick ? "border-strike/60" : isBanned ? "border-line/50" : "border-white/[0.09]"
            )}
            style={{ transform: isBanned ? "scale(0.94)" : "scale(1)" }}
          >
            <Image
              src={map.image}
              alt=""
              fill
              sizes="110px"
              className={cn(
                "object-cover transition-all duration-500",
                isBanned ? "opacity-20 grayscale" : isPick ? "opacity-95" : "opacity-60 saturate-[0.7]"
              )}
            />
            <span
              className={cn(
                "absolute inset-0 transition-colors duration-500",
                isBanned ? "bg-void/70" : isPick ? "bg-strike/10" : "bg-void/40"
              )}
            />

            {/* Risco de banimento */}
            <span
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
              style={{ opacity: isBanned ? 1 : 0 }}
              aria-hidden="true"
            >
              <span className="h-px w-[135%] rotate-[-58deg] bg-loss/80" />
            </span>

            <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void/90 to-transparent" />

            <span
              className={cn(
                "absolute inset-x-0 bottom-0 truncate px-1.5 pb-1.5 text-center font-display text-[10px] font-bold transition-colors duration-500",
                isPick ? "text-strike" : isBanned ? "text-ink-3/50" : "text-ink-2"
              )}
            >
              {map.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export const MapVeto = React.memo(MapVetoImpl);

// ═════════════════════════════════════════════════════════════════════════════
// SKINS — !ws liberado
// ═════════════════════════════════════════════════════════════════════════════

const COMMAND = "!ws";

const SKINS_BANNER = "/assets/banner_skins.webp";

function SkinsUnlockedImpl() {
  const phase = usePhase(COMMAND.length + 5, 620, COMMAND.length);
  const typed = Math.min(phase, COMMAND.length);
  const applied = phase > COMMAND.length + 1;

  return (
    <div className="relative h-full min-h-[10rem] w-full overflow-hidden rounded-lg border border-white/[0.07]">
      <Image
        src={SKINS_BANNER}
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 60vw"
        className={cn(
          "object-cover transition-all duration-[1200ms] [transition-timing-function:var(--ease-out-expo)]",
          applied ? "scale-[1.04] opacity-95 saturate-100" : "scale-100 opacity-60 saturate-[0.45]"
        )}
      />
      <span className="absolute inset-0 bg-void/35" />
      <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-void via-void/70 to-transparent" />

      {/* Console do servidor */}
      <div className="absolute inset-x-4 bottom-4 flex items-center gap-2.5 rounded-lg border border-white/[0.1] bg-void/85 px-3 py-2.5 backdrop-blur-sm">
        <span className="font-mono text-[11px] text-ink-3">&gt;</span>
        <span className="tabular text-[13px] font-bold text-strike">
          {COMMAND.slice(0, typed)}
          <span
            className="ml-px inline-block h-3.5 w-[2px] translate-y-[2px] bg-strike"
            style={{ opacity: typed < COMMAND.length ? 1 : 0.3 }}
            aria-hidden="true"
          />
        </span>
        <span
          className="ml-auto font-display text-[11px] font-semibold transition-colors duration-500"
          style={{ color: applied ? "var(--color-gain)" : "var(--color-ink-3)" }}
        >
          {applied ? "Skins aplicadas" : "servidor"}
        </span>
      </div>
    </div>
  );
}

export const SkinsUnlocked = React.memo(SkinsUnlockedImpl);
