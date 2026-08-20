import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroVideo from "./hero-video";

const FACEIT_ORANGE = "#ff5500";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] overflow-hidden bg-[#07090a] pb-10 pt-28 text-white sm:pb-14 sm:pt-32 lg:pb-14 lg:pt-32 xl:pt-36">
      <HeroVideo />
      <span className="absolute inset-0 bg-black/62" aria-hidden="true" />
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(0,200,255,.13),transparent_38%),linear-gradient(to_bottom,rgba(0,0,0,.2),rgba(0,0,0,.38)_56%,#0a0a0a_100%)]" aria-hidden="true" />

      <div className="bs-shell relative z-10 flex w-full flex-1 flex-col justify-start sm:justify-center lg:translate-y-2 xl:translate-y-4">
        <div className="bs-hero-copy mx-auto max-w-6xl text-center">
          <h1 className="text-[clamp(4.4rem,11.2vw,11rem)] font-black leading-[0.78] tracking-[-0.085em] text-white drop-shadow-[0_8px_40px_rgba(0,0,0,.75)]">
            Blue<span className="text-[#00c8ff]">Strike</span>
          </h1>
          <p className="mt-7 text-[clamp(.72rem,1vw,.94rem)] font-bold uppercase tracking-[0.42em] text-white/82">
            Competir <span className="text-[#00c8ff]">•</span> evoluir <span className="text-[#00c8ff]">•</span> conquistar
          </p>
          <p className="mx-auto mt-6 max-w-[60ch] text-base leading-7 text-white/76 sm:text-lg">
            Campeonatos sérios, servidores preparados e uma carreira competitiva que continua depois de cada partida.
          </p>
          <p className="mx-auto mt-5 inline-flex items-center gap-2.5 text-sm font-black text-[#f5c842] sm:text-base">
            <Banknote className="h-5 w-5" aria-hidden="true" />
            Premiações pagas em PIX, direto para os campeões.
          </p>
        </div>

        <div className="bs-hero-visual mx-auto mt-9 grid w-full max-w-[1120px] gap-3 sm:grid-cols-2">
          <ModeCard
            href="/tournaments"
            image="/assets/banner_bluestrike_home.png"
            brand="BlueStrike"
            description="!ws, bracket automático e premiação garantida em PIX."
            mark={<BlueStrikeMark />}
          />
          <ModeCard
            href="/tournaments/faceit"
            image="/assets/banner_faceit_home.png"
            brand="FACEIT"
            description="Anti-cheat, ELO conectado e competições da comunidade."
            mark={<FaceitMark />}
            faceit
          />
        </div>

        <div className="mt-12 grid w-full grid-cols-[minmax(0,1.35fr)_minmax(0,.85fr)] items-center justify-center gap-3 sm:mt-14 sm:flex sm:w-auto sm:flex-wrap lg:mt-16">
          <Button asChild size="lg" variant="gradient" className="w-full min-w-0 px-4 sm:w-auto sm:min-w-60">
            <Link href="/tournaments">
              Explorar campeonatos
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" className="w-full min-w-0 border-white/18 bg-black/38 px-4 text-white shadow-lg backdrop-blur-md hover:border-white/35 hover:bg-black/60 sm:w-auto sm:min-w-44" variant="outline">
            <Link href="/ranking">Ver ranking</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

interface ModeCardProps {
  href: string;
  image: string;
  brand: string;
  description: string;
  mark: React.ReactNode;
  faceit?: boolean;
}

function ModeCard({ href, image, brand, description, mark, faceit = false }: ModeCardProps) {
  return (
    <Link
      href={href}
      className="group relative min-h-40 overflow-hidden rounded-[1.35rem] border border-white/14 bg-black/46 p-5 shadow-[0_18px_50px_rgba(0,0,0,.28)] backdrop-blur-sm transition-[border-color,box-shadow,transform] duration-500 ease-[var(--ease-out-quint)] hover:-translate-y-0.5 hover:border-white/28 hover:shadow-[0_24px_64px_rgba(0,0,0,.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00c8ff] sm:p-6"
    >
      <Image
        src={image}
        alt=""
        fill
        loading="eager"
        sizes="(max-width: 639px) 100vw, 50vw"
        className="object-cover opacity-[.48] saturate-75 transition-[transform,filter,opacity] duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.018] group-hover:opacity-70 group-hover:saturate-125"
      />
      <span className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/62 to-black/28" aria-hidden="true" />
      <span className="absolute inset-x-0 bottom-0 h-px" style={{ background: faceit ? FACEIT_ORANGE : "#00c8ff" }} aria-hidden="true" />

      <div className="relative flex min-h-[6.5rem] items-center gap-4 pr-12">
        {mark}
        <span>
          <strong className="block text-xl font-black tracking-[-0.035em] text-white sm:text-2xl">{brand}</strong>
          <span className="mt-2 block max-w-[34ch] text-xs leading-5 text-white/68 sm:text-sm">{description}</span>
        </span>
      </div>
      <span className="absolute right-5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/16 bg-white/9 text-white transition-[background-color,border-color,transform] duration-500 ease-[var(--ease-out-quint)] group-hover:translate-x-1 group-hover:border-white/32 group-hover:bg-white/16">
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

function BlueStrikeMark() {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[.7rem] border border-[#00c8ff]/70 bg-[#062d38] shadow-[inset_0_1px_0_rgba(255,255,255,.16),0_8px_24px_rgba(0,200,255,.16)]">
      <Image src="/assets/logo/bluestrike_logo_header.png" alt="" width={46} height={46} loading="eager" className="object-contain opacity-100" />
    </span>
  );
}

function FaceitMark() {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[.7rem] border border-[#ff8a4f]/50 bg-[#ff5500] shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_8px_24px_rgba(255,85,0,.14)]">
      <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
        <path d="M6 7h28v7H14v5h16v7H14v8H6V7Z" fill="white" />
      </svg>
    </span>
  );
}
