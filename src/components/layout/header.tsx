"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Menu, Shield, Trophy, X, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import HeaderElo from "./header-elo";
import NotificationBell from "./notification-bell";
import ThemeToggle from "@/components/theme/theme-toggle";

const navLinks = [
  { href: "/live", label: "Ao vivo", badge: null, live: true },
  { href: "/teams", label: "Times", badge: null, live: false },
  { href: "/players", label: "Players", badge: null, live: false },
  { href: "/ranking", label: "Ranking", badge: null, live: false },
  { href: "/skins", label: "Skins", badge: null, live: false },
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

// ── Campeonatos dropdown ──────────────────────────────────────────────────────

function FaceitLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="#FF5500" />
      <path
        d="M8 8h16v4.5H12.5v3H22v4.5h-9.5V24H8V8z"
        fill="white"
      />
    </svg>
  );
}

interface CampeonatosMenuProps {
  pathname: string;
  onClose?: () => void;
}

function CampeonatosMenu({ pathname, onClose }: CampeonatosMenuProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive =
    pathname.startsWith("/tournaments");

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 300);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
    >
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex min-h-10 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-[color,background-color,box-shadow] select-none lg:text-sm",
          isActive
            ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--panel-shadow-soft)]"
            : "text-[var(--foreground)]/82 hover:bg-[var(--card)]/65 hover:text-[var(--foreground)]"
        )}
      >
        <Trophy className="h-3.5 w-3.5" />
        Campeonatos
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      <div
        className={cn(
          "absolute left-0 top-full pt-2 w-72 z-50",
          "transition-all duration-200 ease-out",
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        {/* Arrow */}
        <div className="ml-5 w-3 h-1.5 overflow-hidden">
          <div className="w-3 h-3 bg-[var(--border)] rotate-45 translate-y-1.5 translate-x-0.5" />
        </div>

        <div className="overflow-hidden rounded-[1.4rem] border border-[var(--border)] bg-[var(--card)] shadow-[var(--panel-shadow)]">

          <div className="p-2 space-y-0.5">
            {/* Header label */}
            <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Modalidades
            </p>

            {/* BlueStrike !ws */}
            <Link
              href="/tournaments"
              prefetch
              onClick={onClose}
              className="group relative flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-150 hover:bg-[var(--primary)]/8 overflow-hidden"
            >
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-[var(--primary)]/5 to-transparent" />

              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/25 group-hover:ring-[var(--primary)]/50 group-hover:bg-[var(--primary)]/15 transition-all duration-150">
                <Image
                  src="/assets/logo/bluestrike_logo_header.png"
                  alt="BlueStrike"
                  width={28}
                  height={28}
                  className="rounded-md object-cover"
                />
              </div>

              <div className="relative min-w-0">
                <p className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-150 flex items-center gap-1.5">
                  BlueStrike
                  <span className="font-mono text-xs px-1 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)] group-hover:bg-[var(--primary)]/25 transition-colors">
                    !ws
                  </span>
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  Skins customizadas • PIX
                </p>
              </div>

              <Zap className="relative ml-auto h-3.5 w-3.5 text-[var(--primary)]/30 group-hover:text-[var(--primary)]/70 transition-colors shrink-0" />
            </Link>

            {/* Divider */}
            <div className="mx-3 h-px bg-[var(--border)]" />

            {/* FACEIT */}
            <Link
              href="/tournaments/faceit"
              prefetch
              onClick={onClose}
              className="group relative flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-150 hover:bg-[#FF5500]/8 overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-[#FF5500]/5 to-transparent" />

              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF5500]/10 ring-1 ring-[#FF5500]/25 group-hover:ring-[#FF5500]/50 group-hover:bg-[#FF5500]/15 transition-all duration-150">
                <FaceitLogo size={22} />
              </div>

              <div className="relative min-w-0">
                <p className="text-sm font-bold text-[var(--foreground)] group-hover:text-[#FF5500] transition-colors duration-150">
                  FACEIT
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  Liga anti-cheat • Competitivo PIX
                </p>
              </div>

              <Zap className="relative ml-auto h-3.5 w-3.5 text-[#FF5500]/30 group-hover:text-[#FF5500]/70 transition-colors shrink-0" />
            </Link>

            {/* Bottom spacing */}
            <div className="pb-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mobile Campeonatos section ────────────────────────────────────────────────

function MobileCampeonatosSection({
  pathname,
  onClose,
}: {
  pathname: string;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive =
    pathname.startsWith("/tournaments");

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "text-[var(--primary)] bg-[var(--primary)]/10"
            : "text-[var(--foreground)] hover:bg-[var(--secondary)]"
        )}
      >
        <Trophy className="h-3.5 w-3.5 shrink-0" />
        Campeonatos
        <ChevronDown
          className={cn(
            "ml-auto h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="ml-4 mt-1 space-y-0.5 border-l border-[var(--border)] pl-3">
          <Link
            href="/tournaments"
            prefetch
            onClick={onClose}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname.startsWith("/tournaments") && !pathname.startsWith("/tournaments/faceit")
                ? "text-[var(--primary)] bg-[var(--primary)]/10"
                : "text-[var(--foreground)] hover:bg-[var(--secondary)]"
            )}
          >
            <Image
              src="/assets/logo/bluestrike_logo_header.png"
              alt="BlueStrike"
              width={16}
              height={16}
              className="rounded object-cover"
            />
            BlueStrike{" "}
            <span className="font-mono text-[10px] px-1 rounded bg-[var(--primary)]/15 text-[var(--primary)]">
              !ws
            </span>
          </Link>

          <Link
            href="/tournaments/faceit"
            prefetch
            onClick={onClose}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname.startsWith("/tournaments/faceit")
                ? "text-[#FF5500] bg-[#FF5500]/10"
                : "text-[var(--foreground)] hover:bg-[var(--secondary)]"
            )}
          >
            <FaceitLogo size={16} />
            FACEIT
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main header ───────────────────────────────────────────────────────────────

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
    const routesToPrefetch = ["/", "/tournaments", "/tournaments/faceit", "/teams", "/players", "/ranking", "/auth/login"];

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
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 md:top-5">
      <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[1700px] sm:w-[calc(100%-2.5rem)]">
        <div
          className={cn(
            "bs-liquid-nav pointer-events-auto grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-full px-2.5 transition-[transform,box-shadow,background-color] duration-500 sm:px-3.5",
            scrolled && "bs-liquid-nav--scrolled"
          )}
        >
          <Link href="/" className="flex items-center gap-2.5 group" onClick={closeMobileMenu}>
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)] shadow-[0_8px_20px_color-mix(in_srgb,var(--primary)_24%,transparent)] transition-transform duration-300 group-hover:scale-[1.03]">
              <Image
                src="/assets/logo/bluestrike_logo_header.png"
                alt="BlueStrike"
                width={40}
                height={40}
                loading="eager"
                className="relative z-10 rounded-full object-cover"
              />
            </div>
            <span className="hidden text-lg font-black tracking-[-0.045em] sm:inline">
              Blue<span className="text-[var(--primary)]">Strike</span>
            </span>
          </Link>

          <nav className="mx-auto hidden items-center justify-center gap-1.5 md:flex lg:gap-2 xl:gap-3">
            {/* Campeonatos dropdown — before Ao vivo */}
            <CampeonatosMenu pathname={pathname} />

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-[color,background-color,box-shadow] lg:text-sm",
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--panel-shadow-soft)]"
                    : "text-[var(--foreground)]/82 hover:bg-[var(--card)]/65 hover:text-[var(--foreground)]"
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

          <div className="hidden items-center justify-end gap-2 md:flex">
            <ThemeToggle compact />
            {user ? (
              <>
                <NotificationBell enabled={true} />
                <Link
                  href={`/profile/${user.publicId}`}
                  prefetch
                  className="group flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 transition-colors hover:border-[var(--primary)]/40"
                >
                  <Avatar className="h-9 w-9 ring-1 ring-[var(--primary)]/20">
                    <AvatarImage src={user.steamAvatarUrl ?? undefined} alt={user.displayName} />
                    <AvatarFallback className="font-black text-[var(--primary)]">
                      {user.displayName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <div className="max-w-[110px] truncate text-xs font-semibold transition-colors group-hover:text-[var(--primary)]">
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
                  <a href="/api/auth/logout">Sair</a>
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
                  <Button variant="ghost" size="sm" className="rounded-full px-5">Entrar</Button>
                </Link>
                <Link href="/auth/login" prefetch>
                  <Button size="sm" variant="gradient" className="rounded-full px-5">Criar conta</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] transition-colors hover:text-[var(--primary)] md:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="bs-liquid-nav pointer-events-auto mx-auto mt-2 w-[calc(100%-1.5rem)] overflow-hidden rounded-[1.5rem] md:hidden">
          <div className="space-y-1 px-4 py-4">
            {/* Campeonatos accordion — first item */}
            <MobileCampeonatosSection pathname={pathname} onClose={closeMobileMenu} />

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
              <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] px-3 pb-3">
                <span className="text-xs font-bold text-[var(--muted-foreground)]">Aparência</span>
                <ThemeToggle />
              </div>
              {user ? (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <NotificationBell enabled={true} />
                  </div>
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
                    <a href="/api/auth/logout" onClick={closeMobileMenu}>Sair</a>
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
                    <Button variant="outline" size="sm" className="w-full">Entrar</Button>
                  </Link>
                  <Link href="/auth/login" prefetch onClick={closeMobileMenu} className="w-full">
                    <Button size="sm" variant="gradient" className="w-full">Começar agora</Button>
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
