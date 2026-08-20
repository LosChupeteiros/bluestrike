import Link from "next/link";
import { ArrowRight, Crosshair, ShieldCheck, Users } from "lucide-react";

const steps = [
  {
    icon: Users,
    title: "Monte seu time",
    description: "Defina sua lineup, distribua funções e convide os jogadores.",
  },
  {
    icon: ShieldCheck,
    title: "Entre na disputa",
    description: "Confira regras, formato e premiação antes da inscrição.",
  },
  {
    icon: Crosshair,
    title: "Evolua no ranking",
    description: "Cada partida oficial movimenta o ELO do time e dos jogadores.",
  },
];

const statement = "Da primeira lineup à final, a BlueStrike organiza a competição para você focar no jogo.";

export default function SocialProof({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <section className="mt-10 bg-[var(--brand-navy)] text-white">
      <div className="bs-page-shell grid gap-12 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-end md:py-24">
        <div>
          <h2 className="bs-scrub-copy max-w-[15ch] text-4xl font-bold leading-[1.03] tracking-[-0.04em] text-white md:text-5xl">
            {statement.split(" ").map((word, index) => (
              <span key={`${word}-${index}`} className="bs-word mr-[0.24em] inline-block">{word}</span>
            ))}
          </h2>
          <Link
            href={isLoggedIn ? "/tournaments" : "/auth/login"}
            className="mt-9 inline-flex items-center gap-2 rounded-[10px] bg-white px-6 py-3 text-sm font-semibold text-[var(--brand-navy)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {isLoggedIn ? "Explorar campeonatos" : "Entrar com Steam"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <ol className="border-t border-white/15">
          {steps.map((step) => (
            <li key={step.title} className="grid grid-cols-[44px_1fr] gap-4 border-b border-white/15 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[var(--brand-cyan)]">
                <step.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-[-0.02em] text-white">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-300">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
