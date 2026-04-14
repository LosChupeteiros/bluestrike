import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "GhostWalker",
    role: "Capitão — Team Nexus",
    avatar: "GW",
    text: "A melhor plataforma de campeonatos que já usei. Sistema de bracket automático funciona perfeitamente e o check-in é simples. Recomendo para qualquer time sério.",
    stars: 5,
  },
  {
    id: 2,
    name: "xSniperBR",
    role: "AWPer — Shadow Strike",
    avatar: "XS",
    text: "Ganhei meu primeiro campeonato aqui! A interface é limpa, as partidas são bem organizadas e o suporte responde rápido. Sensacional.",
    stars: 5,
  },
  {
    id: 3,
    name: "LunaCarry",
    role: "IGL — Aurora CS",
    avatar: "LC",
    text: "Cadastrei meu time e em menos de 10 minutos já estávamos inscritos no campeonato. Muito fácil e profissional. Voltarei sempre.",
    stars: 5,
  },
];

export default function SocialProof() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-14">
        <div className="flex items-center justify-center gap-2 text-[var(--primary)] text-sm font-semibold mb-3">
          <Star className="w-4 h-4 fill-current" />
          Avaliações
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
          O que a comunidade fala
        </h2>
        <p className="text-[var(--muted-foreground)] max-w-lg mx-auto">
          Mais de 12.000 jogadores já competiram na nossa plataforma. Veja o que eles dizem.
        </p>
      </div>

      {/* Testimonials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition-colors"
          >
            <Quote className="w-8 h-8 text-[var(--primary)]/30 mb-4" />
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-900 to-slate-800 border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                {t.avatar}
              </div>
              <div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{t.role}</div>
              </div>
              <div className="ml-auto flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA banner */}
      <div className="mt-16 relative rounded-2xl overflow-hidden border border-[var(--primary)]/20">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/80 via-slate-900/60 to-black" />
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative z-10 px-8 py-12 text-center">
          <h3 className="text-2xl sm:text-3xl font-black mb-3">
            Pronto para competir?
          </h3>
          <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
            Crie sua conta gratuitamente, monte seu time e entre no próximo campeonato disponível.
          </p>
          <a
            href="/auth/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[var(--primary)] text-black font-bold text-sm hover:bg-[var(--primary)]/90 transition-colors shadow-md hover:shadow-[0_0_20px_rgba(0,200,255,0.4)]"
          >
            Criar conta grátis
          </a>
        </div>
      </div>
    </section>
  );
}
