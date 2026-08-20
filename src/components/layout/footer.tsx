import Image from "next/image";
import Link from "next/link";

const columns = [
  {
    heading: "Competir",
    links: [
      { label: "Campeonatos BlueStrike", href: "/tournaments" },
      { label: "Campeonatos FACEIT", href: "/tournaments/faceit" },
      { label: "Criar time", href: "/teams/create" },
      { label: "Partidas ao vivo", href: "/live" },
    ],
  },
  {
    heading: "Comunidade",
    links: [
      { label: "Ranking global", href: "/ranking" },
      { label: "Times", href: "/teams" },
      { label: "Players", href: "/players" },
      { label: "Skins", href: "/skins" },
    ],
  },
];

const railWords = ["Competir", "Evoluir", "Conquistar", "PIX na hora", "Fair play", "BlueStrike"];

function BrandRail() {
  const pass = (
    <span className="flex shrink-0 items-center">
      {railWords.map((word, index) => (
        <span key={`${word}-${index}`} className="flex items-center">
          <span
            className={`text-[clamp(2.5rem,7vw,5rem)] font-black uppercase leading-none tracking-[-0.04em] ${index % 3 === 2 ? "text-[var(--foreground)]/90" : "text-transparent"}`}
            style={index % 3 === 2 ? undefined : { WebkitTextStroke: "1px color-mix(in srgb, var(--foreground) 24%, transparent)" }}
          >
            {word}
          </span>
          <span className="mx-7 h-2 w-2 rotate-45 bg-[var(--primary)]/70 sm:mx-10" aria-hidden="true" />
        </span>
      ))}
    </span>
  );

  return (
    <div className="overflow-hidden border-b border-[var(--border)] py-6" aria-hidden="true">
      <div className="animate-marquee flex w-max items-center will-change-transform">
        {pass}
        {pass}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative mt-8 w-full overflow-hidden bg-[var(--background)]">
      <BrandRail />

      <div className="bs-shell pb-10 pt-20">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center">
                <Image
                  src="/assets/logo/bluestrike_logo_header.png"
                  alt=""
                  width={36}
                  height={36}
                  className="logo-blend h-9 w-9 object-contain"
                />
              </span>
              <span className="text-lg font-black tracking-[-0.03em]">
                Blue<span className="text-[var(--primary)]">Strike</span>
              </span>
            </Link>
            <p className="mt-5 max-w-[40ch] text-sm leading-6 text-[var(--muted-foreground)]">
              Campeonatos brasileiros de Counter-Strike 2 com competição séria e premiação em PIX.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-sm font-bold">{column.heading}</h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-[var(--border)] pt-7 sm:flex-row">
          <p className="font-mono text-[11px] text-[var(--muted-foreground)]">© {new Date().getFullYear()} BlueStrike Esports</p>
          <p className="font-mono text-[11px] text-[var(--muted-foreground)]">Feito para a comunidade brasileira de CS2</p>
        </div>
      </div>

      <div className="pointer-events-none select-none overflow-hidden px-4" aria-hidden="true">
        <span
          className="block translate-y-[0.23em] text-center text-[clamp(3.6rem,15vw,12rem)] font-black uppercase leading-none tracking-[-0.04em] text-transparent"
          style={{ WebkitTextStroke: "1px #2b2b2b" }}
        >
          BlueStrike
        </span>
      </div>
    </footer>
  );
}
