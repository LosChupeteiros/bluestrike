import Link from "next/link";
import { Swords, Globe, Share2, Tv, Camera, GitFork } from "lucide-react";

const links = {
  platform: [
    { label: "Campeonatos", href: "/tournaments" },
    { label: "Ranking", href: "/ranking" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  company: [
    { label: "Sobre nós", href: "/about" },
    { label: "Contato", href: "/contact" },
    { label: "Blog", href: "/blog" },
  ],
  legal: [
    { label: "Termos de Uso", href: "/terms" },
    { label: "Privacidade", href: "/privacy" },
    { label: "Regras", href: "/rules" },
  ],
};

const socials = [
  { icon: Share2, href: "#", label: "Twitter/X" },
  { icon: Tv, href: "#", label: "Twitch" },
  { icon: Globe, href: "#", label: "YouTube" },
  { icon: Camera, href: "#", label: "Instagram" },
  { icon: GitFork, href: "#", label: "GitHub" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--primary)]">
                <Swords className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-black tracking-tight">
                Blue<span className="text-[var(--primary)]">Strike</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-xs">
              A maior plataforma de campeonatos de Counter-Strike 2 do Brasil. Compita, vença e domine o cenário.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="p-2 rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-[var(--foreground)]">Plataforma</h4>
            <ul className="space-y-2.5">
              {links.platform.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-[var(--foreground)]">Empresa</h4>
            <ul className="space-y-2.5">
              {links.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-[var(--foreground)]">Legal</h4>
            <ul className="space-y-2.5">
              {links.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} BlueStrike Esports. Todos os direitos reservados.
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Feito com 💙 para a comunidade de CS2 brasileira
          </p>
        </div>
      </div>
    </footer>
  );
}
