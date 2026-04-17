import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Banknote, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  isLoggedIn?: boolean;
}

const FACEIT_ICON = (
  <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" aria-hidden="true">
    <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500" />
  </svg>
);

export default function Hero({ isLoggedIn = false }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--background)]" />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">

          {/* ── Esquerda: copy hero — largura fixa e compacta ───────────────── */}
          <div className="w-full lg:w-[300px] xl:w-[340px] shrink-0 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/5 text-[var(--primary)] text-[11px] font-semibold mb-6 animate-fade-in">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--destructive)] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--destructive)]" />
              </span>
              Campeonatos transmitidos ao vivo · ELO · PIX
            </div>

            <h1 className="text-5xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[0.9] mb-5 animate-slide-up">
              <span className="block text-[var(--foreground)]">Desafie.</span>
              <span className="block text-[var(--foreground)]">Supere.</span>
              <span className="block text-gradient">Domine.</span>
            </h1>

            <p
              className="text-sm text-[var(--muted-foreground)] mb-5 leading-relaxed animate-slide-up mx-auto lg:mx-0"
              style={{ animationDelay: "0.1s" }}
            >
              A plataforma brasileira de CS2. Monte seu time, entre em torneios e dispute ranking e ganhe dinheiro.
            </p>

            {/* ── Destaque: premiação PIX ──────────────────────────────────── */}
            <div
              className="flex items-start gap-3 rounded-xl border px-4 py-3 mb-7 animate-slide-up mx-auto lg:mx-0 text-left"
              style={{
                borderColor: "rgba(245,200,66,0.22)",
                backgroundColor: "rgba(245,200,66,0.05)",
                animationDelay: "0.15s",
              }}
            >
              <Banknote className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#f5c842" }} aria-hidden="true" />
              <div>
                <p className="text-sm font-bold" style={{ color: "#f5c842" }}>Premiação paga em PIX</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">
                  Direto na sua chave, na hora.
                </p>
              </div>
            </div>

            <div
              className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-start gap-3 mb-7 animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              {isLoggedIn ? (
                <>
                  <Link href="/teams" className="w-full sm:w-auto lg:w-full">
                    <Button size="lg" variant="gradient" className="w-full gap-2 font-bold">
                      Monte seu time
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </Link>
                  <Link href="/ranking" className="w-full sm:w-auto lg:w-full">
                    <Button size="lg" variant="outline" className="w-full gap-2">
                      Ver ranking
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="w-full sm:w-auto lg:w-full">
                    <Button size="lg" variant="gradient" className="w-full gap-2 font-bold">
                      Entrar com Steam
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </Link>
                  <Link href="/ranking" className="w-full sm:w-auto lg:w-full">
                    <Button size="lg" variant="outline" className="w-full gap-2">
                      Ver ranking
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div
              className="flex flex-col items-center lg:items-start gap-2 animate-slide-up"
              style={{ animationDelay: "0.3s" }}
            >
              {[
                { icon: Shield, label: "Anti-cheat e arbitragem" },
                { icon: Zap, label: "Brackets automáticos" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                  <item.icon className="w-3 h-3 text-[var(--primary)]" aria-hidden="true" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Direita: portal cards — flex-1 toma o espaço restante ───────── */}
          <div
            className="flex-1 min-w-0 grid grid-cols-2 gap-4 animate-slide-up"
            style={{ animationDelay: "0.35s" }}
          >

            {/* ── Card BlueStrike ──────────────────────────────────────────── */}
            <Link href="/tournaments" className="group block">
              <div className="bs-portal-card relative rounded-2xl overflow-hidden border border-[var(--primary)]/20 bg-[var(--card)] h-[400px] sm:h-[480px] lg:h-[520px] xl:h-[560px] transition-all duration-300 hover:border-[var(--primary)]/55 hover:shadow-[0_0_48px_rgba(0,200,255,0.14)] hover:-translate-y-1.5">

                {/* Imagem de fundo */}
                <Image
                  src="/assets/banner_bluestrike_home.png"
                  alt=""
                  fill
                  sizes="50vw"
                  className="object-cover object-center"
                  priority
                />
                {/* Overlay atmosférico sobre a imagem */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#001a2e]/70 via-[#0a1520]/50 to-black/60" />
                <div className="absolute inset-0 grid-bg opacity-20" />
                {/* Glow superior direito */}
                <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-[var(--primary)]/12 blur-3xl transition-all duration-500 group-hover:bg-[var(--primary)]/22" />
                {/* Linha de luz inferior */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {/* Fade inferior para o conteúdo */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

                {/* Mira decorativa */}
                <div className="absolute top-6 right-6 opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.14]" aria-hidden="true">
                  <svg width="80" height="80" viewBox="0 0 52 52" fill="none">
                    <circle cx="26" cy="26" r="11" stroke="#00c8ff" strokeWidth="1.5" />
                    <circle cx="26" cy="26" r="2.5" fill="#00c8ff" />
                    <line x1="26" y1="0" x2="26" y2="13" stroke="#00c8ff" strokeWidth="1.5" />
                    <line x1="26" y1="39" x2="26" y2="52" stroke="#00c8ff" strokeWidth="1.5" />
                    <line x1="0" y1="26" x2="13" y2="26" stroke="#00c8ff" strokeWidth="1.5" />
                    <line x1="39" y1="26" x2="52" y2="26" stroke="#00c8ff" strokeWidth="1.5" />
                  </svg>
                </div>

                {/* Conteúdo */}
                <div className="absolute inset-0 flex flex-col justify-between p-6">
                  <span className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/25 text-[var(--primary)] text-xs font-bold tracking-wide">
                    <Zap className="w-3 h-3" aria-hidden="true" />
                    BLUESTRIKE
                  </span>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--primary)] mb-3">
                      Campeonatos Próprios
                    </p>
                    <h2 className="text-2xl font-black leading-tight text-white mb-3">
                     Todas as skins liberadas<br /> Sonhe enquanto compete.
                    </h2>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-6">
                      !ws ativo em todos os servidores — use qualquer faca, glove ou skin sem restrição. Premiação em PIX, bracket automático.
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-[var(--primary)] text-sm font-semibold transition-all duration-200 group-hover:gap-2.5">
                      Ver campeonatos
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* ── Card FACEIT ──────────────────────────────────────────────── */}
            <Link href="/tournaments/faceit" className="group block">
              <div className="relative rounded-2xl overflow-hidden border border-[#FF5500]/18 bg-[var(--card)] h-[400px] sm:h-[480px] lg:h-[520px] xl:h-[560px] transition-all duration-300 hover:border-[#FF5500]/55 hover:shadow-[0_0_48px_rgba(255,85,0,0.13)] hover:-translate-y-1.5">

                {/* Imagem de fundo */}
                <Image
                  src="/assets/banner_faceit_home.png"
                  alt=""
                  fill
                  sizes="50vw"
                  className="object-cover object-center"
                  priority
                />
                {/* Overlay atmosférico sobre a imagem */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e0800]/70 via-[#110600]/50 to-black/60" />
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: "linear-gradient(rgba(255,85,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,85,0,0.06) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
                {/* Glow superior direito */}
                <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-[#FF5500]/10 blur-3xl transition-all duration-500 group-hover:bg-[#FF5500]/20" />
                {/* Linha de luz inferior */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF5500]/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {/* Fade inferior */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

                {/* Logo F decorativa */}
                <div className="absolute top-5 right-5 opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.12]" aria-hidden="true">
                  <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="96" height="96">
                    <path d="M2 2h14v3H5v3h9v3H5v5H2V2Z" fill="#FF5500" />
                  </svg>
                </div>

                {/* Conteúdo */}
                <div className="absolute inset-0 flex flex-col justify-between p-6">
                  <span className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border" style={{ backgroundColor: "rgba(255,85,0,0.10)", borderColor: "rgba(255,85,0,0.28)", color: "#FF5500" }}>
                    {FACEIT_ICON}
                    FACEIT
                  </span>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#FF5500" }}>
                      Plataforma FACEIT
                    </p>
                    <h2 className="text-2xl font-black leading-tight text-white mb-3">
                      Jogue como um Pro<br />Maiores premiações
                    </h2>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-6">
                      FACEIT AC ativo em todas as partidas. Sem smurfs, sem desculpa. Competição com critério e ranking que conta de verdade.
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 group-hover:gap-2.5" style={{ color: "#FF5500" }}>
                      Ver campeonatos
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
    </section>
  );
}
