import Link from "next/link";
import { Swords } from "lucide-react";

const platformLinks = [
  { label: "Campeonatos", href: "/tournaments" },
  { label: "Ranking", href: "/ranking" },
  { label: "Times", href: "/teams" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-10">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--primary)]">
                <Swords className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-black tracking-tight">
                Blue<span className="text-[var(--primary)]">Strike</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-sm">
              Plataforma brasileira de campeonatos de Counter-Strike 2.
              Competição séria, fairplay e reconhecimento real.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-[var(--foreground)]">Plataforma</h4>
            <ul className="space-y-2.5">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} BlueStrike Esports
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Feito para a comunidade brasileira de CS2
          </p>
        </div>
      </div>
    </footer>
  );
}
