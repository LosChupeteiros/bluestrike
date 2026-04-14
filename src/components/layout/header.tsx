"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Shield, Swords, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/tournaments", label: "Campeonatos" },
  { href: "/teams", label: "Times" },
  { href: "/ranking", label: "Ranking" },
];

interface HeaderUser {
  displayName: string;
  steamAvatarUrl: string | null;
  elo: number;
  publicId: number;
  isAdmin: boolean;
}

interface HeaderProps {
  user: HeaderUser | null;
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)] shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={closeMobileMenu}>
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--primary)] shadow-md group-hover:shadow-[0_0_16px_rgba(0,200,255,0.5)] transition-shadow">
              <Swords className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-black tracking-tight">
              Blue<span className="text-[var(--primary)]">Strike</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "text-[var(--primary)] bg-[var(--primary)]/10"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href={`/profile/${user.publicId}`}
                  className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--secondary)]"
                >
                  <Avatar className="h-9 w-9 ring-1 ring-[var(--primary)]/20">
                    <AvatarImage src={user.steamAvatarUrl ?? undefined} alt={user.displayName} />
                    <AvatarFallback className="font-black text-[var(--primary)]">
                      {user.displayName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <div className="max-w-[160px] truncate text-sm font-semibold group-hover:text-[var(--primary)] transition-colors">
                      {user.displayName}
                    </div>
                    <div className="mt-0.5 text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-[var(--primary)]/80">
                      {user.elo} ELO
                    </div>
                  </div>
                </Link>

                {user.isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Button>
                  </Link>
                )}

                <Button asChild variant="ghost" size="sm">
                  <a href="/api/auth/logout">
                    Sair
                  </a>
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="sm" variant="gradient">
                    Comecar agora
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-md hover:bg-[var(--secondary)] transition-colors"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]/98 backdrop-blur-md">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "text-[var(--primary)] bg-[var(--primary)]/10"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-2">
              {user ? (
                <div className="space-y-2">
                  <Link
                    href={`/profile/${user.publicId}`}
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3"
                  >
                    <Avatar className="h-10 w-10 ring-1 ring-[var(--primary)]/20">
                      <AvatarImage src={user.steamAvatarUrl ?? undefined} alt={user.displayName} />
                      <AvatarFallback className="font-black text-[var(--primary)]">
                        {user.displayName.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{user.displayName}</div>
                      <div className="mt-0.5 text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-[var(--primary)]/80">
                        {user.elo} ELO
                      </div>
                    </div>
                  </Link>

                  {user.isAdmin && (
                    <Link href="/admin" onClick={closeMobileMenu}>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <Shield className="w-4 h-4" />
                        Admin
                      </Button>
                    </Link>
                  )}

                  <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                    <a href="/api/auth/logout" onClick={closeMobileMenu}>
                      Sair
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/auth/login" onClick={closeMobileMenu} className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      Entrar
                    </Button>
                  </Link>
                  <Link href="/auth/login" onClick={closeMobileMenu} className="w-full">
                    <Button size="sm" variant="gradient" className="w-full">
                      Comecar agora
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
