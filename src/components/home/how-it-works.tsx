import Link from "next/link";
import { ArrowRight, Crosshair, ShieldCheck, Users } from "lucide-react";

const steps = [
  {
    icon: Users,
    title: "Monte seu time",
    body: "Crie a equipe, organize a lineup e convide os jogadores. O capitão controla funções, titulares e reserva.",
    cta: "Criar time",
    href: "/teams/create",
  },
  {
    icon: ShieldCheck,
    title: "Inscreva em um campeonato",
    body: "Confira regras, formato e premiação antes de confirmar. A vaga acompanha o time durante todo o fluxo.",
    cta: "Ver campeonatos",
    href: "/tournaments",
  },
  {
    icon: Crosshair,
    title: "Dispute, suba no ranking e ganhe seus prêmios em PIX",
    body: "Servidor dedicado, chave automática e ELO atualizado a cada resultado. A premiação vai para a chave cadastrada.",
    cta: "Ver ranking",
    href: "/ranking",
    cash: true,
  },
];

export default function HowItWorks() {
  return (
    <section className="bs-shell bs-section" data-reveal>
      <div className="max-w-3xl">
        <h2 className="type-h2">Do login à final em três passos.</h2>
        <p className="type-body mt-5">A plataforma organiza o campeonato para sua equipe focar na partida.</p>
      </div>
      <ol className="bs-inset relative mt-14 grid gap-3 overflow-hidden p-3 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="min-h-[22rem]">
              <Link
                href={step.href}
                className="bs-bento-card group flex h-full min-h-[22rem] p-7 transition-[border-color,box-shadow,transform] duration-500 ease-[var(--ease-out-quint)] hover:-translate-y-0.5 hover:border-[var(--primary)]/30 hover:shadow-[var(--panel-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:p-9"
                aria-label={`${step.title}: ${step.cta}`}
              >
              <div className="flex h-full min-h-[17rem] w-full flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--primary)]/18 bg-[var(--primary)]/8 text-[var(--primary)] shadow-[var(--inset-shadow)] transition-colors duration-500 group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)]">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="tabular text-5xl font-black tracking-[-.07em] text-[var(--primary)]/32 transition-colors duration-500 group-hover:text-[var(--primary)]/62">0{index + 1}</span>
                </div>
                <div className="mt-12">
                  <h3 className="max-w-[24ch] text-2xl font-black leading-[1.08] tracking-[-0.03em] sm:text-3xl">{step.title}</h3>
                  <p className="mt-4 max-w-[58ch] text-sm leading-7 text-[var(--muted-foreground)]">{step.body}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] transition-[gap,color] duration-500 group-hover:gap-3">
                    {step.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
              </Link>
            </li>
          ))}
      </ol>
    </section>
  );
}
