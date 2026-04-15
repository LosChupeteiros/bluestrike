import Link from "next/link";
import { ArrowRight, Users, Trophy, Gamepad2 } from "lucide-react";

const steps = [
  {
    icon: Users,
    title: "Monte seu time",
    description:
      "Crie a equipe, suba logo e banner, defina a senha de convite e distribua o link para os amigos. Capitão controla quem entra e qual função cada um joga.",
    cta: "Criar time",
    href: "/teams/create",
  },
  {
    icon: Trophy,
    title: "Inscreva em um campeonato",
    description:
      "Escolha entre os torneios abertos, confira regras, premiação e formato. Inscrição é por time completo — 5 titulares e 1 substituto opcional.",
    cta: "Ver campeonatos",
    href: "/tournaments",
  },
  {
    icon: Gamepad2,
    title: "Dispute e suba no ranking",
    description:
      "Check-in na janela da partida, servidor dedicado e bracket automático. Cada partida ajusta o ELO do time e dos jogadores no ranking global.",
    cta: "Ver ranking",
    href: "/ranking",
  },
];

interface SocialProofProps {
  isLoggedIn?: boolean;
}

export default function SocialProof({ isLoggedIn = false }: SocialProofProps) {
  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <div className="flex items-center justify-center gap-2 text-[var(--primary)] text-sm font-semibold mb-3">
          <Gamepad2 className="w-4 h-4" />
          Como funciona
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
          Do login à final em três passos
        </h2>
        <p className="text-[var(--muted-foreground)] max-w-lg mx-auto">
          Fluxo pensado para o cenário brasileiro. Sem planilha, sem Discord, sem ruído.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="relative p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition-colors"
          >
            <div className="absolute -top-3 left-6 px-2 py-0.5 rounded-md bg-[var(--primary)] text-[10px] font-black uppercase tracking-[0.2em] text-black">
              Passo {index + 1}
            </div>
            <step.icon className="w-8 h-8 text-[var(--primary)] mb-4" />
            <h3 className="font-black text-lg mb-2">{step.title}</h3>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-4">
              {step.description}
            </p>
            <Link
              href={step.href}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:text-white transition-colors"
            >
              {step.cta}
              <span aria-hidden>→</span>
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-16 relative rounded-2xl overflow-hidden border border-[var(--primary)]/20">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/80 via-slate-900/60 to-black" />
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative z-10 px-8 py-12 text-center">
          {isLoggedIn ? (
            <>
              <h3 className="text-2xl sm:text-3xl font-black mb-3">
                Pronto para a próxima batalha?
              </h3>
              <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
                Confira os campeonatos abertos, monte sua line e inscreva seu time.
              </p>
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[var(--primary)] text-black font-bold text-sm hover:bg-[var(--primary)]/90 transition-colors shadow-md hover:shadow-[0_0_20px_rgba(0,200,255,0.4)]"
              >
                Ver campeonatos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-2xl sm:text-3xl font-black mb-3">
                Pronto para competir?
              </h3>
              <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
                Entre com sua conta Steam, crie seu time e inscreva no próximo campeonato.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[var(--primary)] text-black font-bold text-sm hover:bg-[var(--primary)]/90 transition-colors shadow-md hover:shadow-[0_0_20px_rgba(0,200,255,0.4)]"
              >
                Entrar com Steam
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
