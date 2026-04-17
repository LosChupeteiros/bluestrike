"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Shield, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import HeaderElo from "./header-elo";

const navLinks = [
  { href: "/live", label: "Ao vivo", badge: null, live: true },
  { href: "/teams", label: "Times", badge: null, live: false },
  { href: "/players", label: "Players", badge: null, live: false },
  { href: "/ranking", label: "Ranking", badge: null, live: false },
];

interface HeaderUser {
  displayName: string;
  steamAvatarUrl: string | null;
  elo: number;
  publicId: number;
  isAdmin: boolean;
  faceitLevel?: number | null;
  faceitElo?: number | null;
}

interface HeaderProps {
  user: HeaderUser | null;
  authState?: "ready" | "loading";
}

export default function Header({ user, authState = "ready" }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const routesToPrefetch = ["/", "/tournaments", "/teams", "/players", "/ranking", "/auth/login"];

    if (user) {
      routesToPrefetch.push(`/profile/${user.publicId}`);
      routesToPrefetch.push("/cadastro");
    }

    const prefetchRoutes = () => {
      for (const route of routesToPrefetch) {
        router.prefetch(route);
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetchRoutes);
      return () => window.cancelIdleCallback(idleId);
    }

    const timeout = setTimeout(prefetchRoutes, 250);
    return () => clearTimeout(timeout);
  }, [router, user]);

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
            <div className="relative flex items-center justify-center w-9 h-9 overflow-hidden rounded-lg bg-[var(--primary)] shadow-md group-hover:shadow-[0_0_16px_rgba(0,200,255,0.5)] transition-shadow">
              <Image
                src="/assets/logo/bluestrike_logo_header.png"
                alt="BlueStrike"
                width={36}
                height={36}
                priority
                className="relative z-10 h-9 w-9 rounded-lg object-cover"
              />
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
                prefetch
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "text-[var(--primary)] bg-[var(--primary)]/10"
                    : "text-[var(--foreground)] hover:bg-[var(--secondary)]"
                )}
              >
                {link.live && (
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[var(--destructive)]" />
                )}
                {link.label}
                {link.badge && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold leading-none"
                    style={{ color: "#f5c842", backgroundColor: "rgba(245,200,66,0.12)" }}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href={`/profile/${user.publicId}`}
                  prefetch
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
                    <HeaderElo initialElo={user.elo} faceitLevel={user.faceitLevel} faceitElo={user.faceitElo} />
                  </div>
                </Link>

                {user.isAdmin && (
                  <Link href="/admin" prefetch>
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
            ) : authState === "loading" ? (
              <>
                <div className="h-9 w-24 animate-pulse rounded-md border border-[var(--border)] bg-[var(--secondary)]/70" />
                <div className="h-9 w-32 animate-pulse rounded-md border border-[var(--border)] bg-[var(--secondary)]/70" />
              </>
            ) : (
              <>
                <Link href="/auth/login" prefetch>
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/auth/login" prefetch>
                  <Button size="sm" variant="gradient">
                    Começar agora
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
                prefetch
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "text-[var(--primary)] bg-[var(--primary)]/10"
                    : "text-[var(--foreground)] hover:bg-[var(--secondary)]"
                )}
              >
                {link.live && (
                  <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--destructive)]" />
                )}
                {link.label}
                {link.badge && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold leading-none"
                    style={{ color: "#f5c842", backgroundColor: "rgba(245,200,66,0.12)" }}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="pt-2">
              {user ? (
                <div className="space-y-2">
                  <Link
                    href={`/profile/${user.publicId}`}
                    prefetch
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
                      <HeaderElo initialElo={user.elo} faceitLevel={user.faceitLevel} faceitElo={user.faceitElo} />
                    </div>
                  </Link>

                  {user.isAdmin && (
                    <Link href="/admin" prefetch onClick={closeMobileMenu}>
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
              ) : authState === "loading" ? (
                <div className="space-y-2">
                  <div className="h-9 w-full animate-pulse rounded-md border border-[var(--border)] bg-[var(--secondary)]/70" />
                  <div className="h-9 w-full animate-pulse rounded-md border border-[var(--border)] bg-[var(--secondary)]/70" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/auth/login" prefetch onClick={closeMobileMenu} className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      Entrar
                    </Button>
                  </Link>
                  <Link href="/auth/login" prefetch onClick={closeMobileMenu} className="w-full">
                    <Button size="sm" variant="gradient" className="w-full">
                      Começar agora
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
