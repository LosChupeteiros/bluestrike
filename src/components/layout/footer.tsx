import Link from "next/link";
import Image from "next/image";

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

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line/70 bg-void">
      <div className="mx-auto w-full max-w-[1360px] px-4 pb-10 pt-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-16">
          <div>
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center">
                <Image
                  src="/assets/logo/bluestrike_logo_header.png"
                  alt=""
                  width={36}
                  height={36}
                  className="logo-blend h-9 w-9 object-contain"
                />
              </span>
              <span className="font-display text-lg font-extrabold tracking-[-0.03em] text-ink">
                Blue<span className="text-strike">Strike</span>
              </span>
            </Link>

            <p className="mt-5 max-w-[38ch] text-sm leading-relaxed text-ink-3">
              Plataforma brasileira de campeonatos de Counter-Strike 2. Competição séria,
              fairplay e premiação paga em PIX.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="tick">{column.heading}</h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-ink-2 transition-colors duration-300 hover:text-strike"
                    >
                      <span className="h-px w-0 bg-strike transition-all duration-300 [transition-timing-function:var(--ease-out-quint)] group-hover:w-3" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-line/70 pt-7 sm:flex-row">
          <p className="font-mono text-[11px] tracking-[0.04em] text-ink-3">
            © {new Date().getFullYear()} BlueStrike Esports
          </p>
          <p className="font-mono text-[11px] tracking-[0.04em] text-ink-3">
            Feito para a comunidade brasileira de CS2
          </p>
        </div>
      </div>

      {/* Wordmark watermark — outlined so it sits behind the content, not on it */}
      <div
        className="pointer-events-none select-none overflow-hidden px-4 sm:px-6 lg:px-8"
        aria-hidden="true"
      >
        <span
          className="block translate-y-[0.22em] text-center font-display text-[clamp(3.5rem,15vw,12rem)] font-extrabold uppercase leading-none tracking-[-0.05em] text-transparent"
          style={{ WebkitTextStroke: "1px color-mix(in oklab, var(--color-line-2) 70%, transparent)" }}
        >
          BlueStrike
        </span>
      </div>
    </footer>
  );
}
