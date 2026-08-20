import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/magnetic";

interface HeroProps {
  isLoggedIn?: boolean;
}

const guarantees = ["Anti-cheat", "Servidor dedicado", "Chave automática"];

export default function Hero({ isLoggedIn = false }: HeroProps) {
  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden bg-void">
      <div className="reticle-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-[1440px] px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-24 lg:pt-36">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12 xl:gap-16">
          {/* ── Copy ──────────────────────────────────────────────────────── */}
          <div className="max-w-[32rem]">
            <p
              className="animate-fade-in mb-8 flex items-center gap-2.5 font-display text-[13px] font-semibold text-ink-2"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
                <span className="animate-breathe absolute inline-flex h-full w-full rounded-full bg-live" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
              </span>
              Campeonatos ao vivo
              <span className="text-line-2" aria-hidden="true">/</span>
              <span className="text-prize">premiação em PIX</span>
            </p>

            <h1 className="type-display text-ink">
              <span className="animate-line-in block sm:inline" style={{ animationDelay: "0.15s" }}>
                Desafie.
              </span>{" "}
              <span className="animate-line-in block sm:inline" style={{ animationDelay: "0.27s" }}>
                Supere.
              </span>
              <span className="animate-line-in block text-strike" style={{ animationDelay: "0.39s" }}>
                Domine.
              </span>
            </h1>

            <p
              className="animate-slide-up type-body mt-7 max-w-[42ch] text-[1.0625rem]"
              style={{ animationDelay: "0.5s" }}
            >
              A plataforma brasileira de CS2. Monte seu time, entre em campeonatos com
              premiação paga em PIX e dispute o ranking com quem leva a sério.
            </p>

            <div
              className="animate-slide-up mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: "0.6s" }}
            >
              <Magnetic strength={0.24} className="w-full sm:w-auto">
                <Link href={isLoggedIn ? "/tournaments" : "/auth/login"} className="block">
                  <Button variant="gradient" size="lg" className="w-full gap-2 sm:w-auto">
                    {isLoggedIn ? "Ver campeonatos" : "Entrar com Steam"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </Magnetic>

              <Link href="/ranking" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Ver o ranking
                </Button>
              </Link>
            </div>

            <ul
              className="animate-slide-up mt-10 flex items-center gap-4"
              style={{ animationDelay: "0.7s" }}
            >
              {guarantees.map((item, index) => (
                <li key={item} className="flex items-center gap-4">
                  {index > 0 && <span className="h-3.5 w-px bg-line-2" aria-hidden="true" />}
                  <span className="font-display text-[13px] font-semibold text-ink-3">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Os dois modos ─────────────────────────────────────────────── */}
          <div
            className="animate-slide-up grid grid-cols-1 gap-3.5 sm:grid-cols-2"
            style={{ animationDelay: "0.45s" }}
          >
            <ModeCard
              href="/tournaments"
              accent="var(--color-strike)"
              image="/assets/banner_bluestrike_home.png"
              kicker="Campeonatos próprios"
              title="Todas as skins liberadas"
              body="!ws ativo em todos os servidores. Qualquer faca, glove ou skin, sem restrição."
              mark={
                <Image
                  src="/assets/logo/bluestrike_logo_header.png"
                  alt=""
                  width={28}
                  height={28}
                  className="logo-blend h-7 w-7 object-contain"
                />
              }
              wordmark={
                <>
                  Blue<span className="text-strike">Strike</span>
                </>
              }
            />

            <ModeCard
              href="/tournaments/faceit"
              accent="var(--color-faceit)"
              image="/assets/banner_faceit_home.png"
              kicker="Plataforma FACEIT"
              title="Jogue como um profissional"
              body="FACEIT Anti-cheat em todas as partidas. Sem smurf, premiações maiores."
              mark={
                <svg viewBox="0 0 18 18" className="h-5 w-5" aria-hidden="true">
                  <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="var(--color-faceit)" />
                </svg>
              }
              wordmark="FACEIT"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

interface ModeCardProps {
  href: string;
  accent: string;
  image: string;
  kicker: string;
  title: string;
  body: string;
  mark: React.ReactNode;
  wordmark: React.ReactNode;
}

function ModeCard({ href, accent, image, kicker, title, body, mark, wordmark }: ModeCardProps) {
  return (
    <Link
      href={href}
      prefetch
      className="group relative block h-[24rem] overflow-hidden rounded-xl border border-white/[0.09] bg-abyss transition-[border-color,transform] duration-500 [transition-timing-function:var(--ease-out-quint)] hover:-translate-y-1 hover:border-white/[0.2] sm:h-[28rem] lg:h-[33rem]"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 36vw"
        priority
        className="object-cover opacity-[0.62] saturate-[0.85] transition-all duration-[1200ms] [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.06] group-hover:opacity-[0.85] group-hover:saturate-100"
      />

      {/* Escurecimento sólido só onde o texto precisa de contraste */}
      <div className="absolute inset-0 bg-void/25" />
      <div className="absolute inset-x-0 bottom-0 h-[68%] bg-gradient-to-t from-void via-void/88 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-void/85 to-transparent" />

      <span
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 transition-transform duration-700 [transition-timing-function:var(--ease-out-expo)] group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        aria-hidden="true"
      />

      <div className="relative flex h-full flex-col justify-between p-6">
        {/* Marca: ícone + nome, na mesma tipografia da nav */}
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.12] bg-void/70 backdrop-blur-sm">
            {mark}
          </span>
          <span className="font-display text-lg font-extrabold tracking-[-0.03em] text-ink">
            {wordmark}
          </span>
        </span>

        <div>
          <span className="font-display text-[13px] font-semibold" style={{ color: accent }}>
            {kicker}
          </span>

          <h2 className="type-h3 mt-2 max-w-[14ch] text-ink">{title}</h2>

          <p className="mt-2.5 max-w-[34ch] text-[13px] leading-relaxed text-ink-2">{body}</p>

          <span
            className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold transition-[gap] duration-300 group-hover:gap-3.5"
            style={{ color: accent }}
          >
            Ver campeonatos
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
