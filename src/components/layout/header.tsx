"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
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
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex min-h-10 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-[color,background-color] select-none lg:text-sm",
          isActive
            ? "bg-[var(--primary)]/8 text-[var(--primary)]"
            : "text-[var(--foreground)]/84 hover:bg-white/[0.055] hover:text-[var(--foreground)]"
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
        <div className="bs-liquid-popover overflow-hidden rounded-[1.4rem]">

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

// ── Menu do jogador (hover + clique) ─────────────────────────────────────────

interface PlayerMenuItem {
  href: string;
  label: string;
  hint: string;
  icon: typeof Swords;
}

function ProfileMenu({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const profileHref = `/profile/${user.publicId}`;

  const items: PlayerMenuItem[] = [
    {
      href: `${profileHref}#partidas`,
      label: "Minhas partidas",
      hint: "Histórico, placares e variação de ELO",
      icon: Swords,
    },
    {
      href: `${profileHref}#times`,
      label: "Meus times",
      hint: "Lines de 1x1 a 5x5 e convites",
      icon: Users,
    },
    {
      href: "/skins",
      label: "Minhas skins",
      hint: "Loadout CT e TR no servidor !ws",
      icon: Sparkles,
    },
  ];

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 260);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  useEffect(() => () => cancelClose(), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
    >
      {/* Sem cápsula própria: um card dentro da barra de vidro fica redundante.
          O gatilho encosta na nav e só ganha fundo no hover, igual aos links. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Menu de ${user.displayName}`}
        className={cn(
          "group flex min-h-11 items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors duration-200",
          open ? "bg-[var(--primary)]/12" : "hover:bg-[var(--primary)]/[0.07]"
        )}
      >
        <span className="relative shrink-0">
          <Avatar
            className={cn(
              "h-11 w-11 ring-1 transition-[box-shadow] duration-300",
              open
                ? "ring-[var(--primary)]/55 shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_14%,transparent)]"
                : "ring-[color-mix(in_srgb,var(--foreground)_20%,transparent)] group-hover:ring-[var(--primary)]/45 group-hover:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_11%,transparent)]"
            )}
          >
            <AvatarImage src={user.steamAvatarUrl ?? undefined} alt="" sizes="128px" />
            <AvatarFallback className="text-base font-black text-[var(--primary)]">
              {user.displayName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* Reflexo de vidro no topo do avatar */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(to_bottom,rgb(255_255_255/0.22),rgb(255_255_255/0)_46%)]"
          />
        </span>

        <div className="min-w-0 text-left">
          <div className={cn(
            "max-w-[120px] truncate text-[13px] font-bold leading-tight tracking-[-0.01em] transition-colors",
            open ? "text-[var(--primary)]" : "group-hover:text-[var(--primary)]"
          )}>
            {user.displayName}
          </div>
          <HeaderElo initialElo={user.elo} faceitLevel={user.faceitLevel} faceitElo={user.faceitElo} />
        </div>

        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-[var(--muted-foreground)] transition-transform duration-200",
            open && "rotate-180 text-[var(--primary)]"
          )}
        />
      </button>

      <div
        role="menu"
        aria-label="Atalhos do jogador"
        className={cn(
          "absolute right-0 top-full z-50 w-[19rem] pt-2",
          "transition-all duration-200 ease-out",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        )}
      >
        <div className="bs-liquid-popover overflow-hidden rounded-[1.4rem]">
          {/* Identidade */}
          <Link
            href={profileHref}
            prefetch
            role="menuitem"
            onClick={() => setOpen(false)}
            className="group relative flex items-center gap-3 border-b border-[var(--border)] px-4 py-4 transition-colors hover:bg-[var(--primary)]/6"
          >
            <Avatar className="h-12 w-12 rounded-xl ring-1 ring-[var(--primary)]/25">
              <AvatarImage src={user.steamAvatarUrl ?? undefined} alt="" />
              <AvatarFallback className="rounded-xl text-lg font-black text-[var(--primary)]">
                {user.displayName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                {user.displayName}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <UserRound className="h-3 w-3" aria-hidden="true" />
                Ver perfil completo
              </p>
            </div>

            <div className="shrink-0 rounded-lg border border-[var(--primary)]/25 bg-[var(--primary)]/10 px-2 py-1 text-center">
              <span className="block font-mono text-sm font-black leading-none text-[var(--primary)]">
                {user.elo}
              </span>
              <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--primary)]/60">
                ELO
              </span>
            </div>
          </Link>

          {/* Atalhos */}
          <div className="space-y-0.5 p-2">
            <p className="px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Minha área
            </p>

            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-[var(--primary)]/8"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] ring-1 ring-[var(--primary)]/20 transition-all duration-150 group-hover:bg-[var(--primary)]/16 group-hover:ring-[var(--primary)]/45">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-[var(--muted-foreground)]">
                      {item.hint}
                    </span>
                  </span>
                </Link>
              );
            })}

            {user.isAdmin && (
              <>
                <div className="mx-3 my-1 h-px bg-[var(--border)]" />
                <Link
                  href="/admin"
                  prefetch
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-[#f5c842]/8"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5c842]/10 text-[#f5c842] ring-1 ring-[#f5c842]/20 transition-all duration-150 group-hover:ring-[#f5c842]/45">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[var(--foreground)] transition-colors group-hover:text-[#f5c842]">
                      Painel admin
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-[var(--muted-foreground)]">
                      Campeonatos, brackets e premiação
                    </span>
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Sair — separado das ações de navegação */}
          <a
            href="/api/auth/logout"
            role="menuitem"
            className="flex items-center gap-2 border-t border-[var(--border)] px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--destructive)]/8 hover:text-[var(--destructive)]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sair da conta
          </a>
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
                    ? "bg-[var(--primary)]/8 text-[var(--primary)]"
                    : "text-[var(--foreground)]/84 hover:bg-white/[0.055] hover:text-[var(--foreground)]"
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
                {/* Agrupa os controles sem caixa: separador fino que some nas pontas */}
                <span
                  aria-hidden="true"
                  className="mx-0.5 h-7 w-px bg-gradient-to-b from-transparent via-[color-mix(in_srgb,var(--foreground)_18%,transparent)] to-transparent"
                />
                <ProfileMenu user={user} />
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
            className="bs-liquid-control ml-auto flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:text-[var(--primary)] md:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="bs-liquid-nav pointer-events-auto mx-auto mt-2 w-[calc(100%-1.5rem)] rounded-[1.5rem] md:hidden"
          style={{ overflow: "hidden" }}
        >
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
                    className="bs-liquid-control flex items-center gap-3 rounded-2xl px-3 py-3"
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

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { href: `/profile/${user.publicId}#partidas`, label: "Partidas", icon: Swords },
                      { href: `/profile/${user.publicId}#times`, label: "Times", icon: Users },
                      { href: "/skins", label: "Skins", icon: Sparkles },
                    ].map((shortcut) => {
                      const Icon = shortcut.icon;
                      return (
                        <Link
                          key={shortcut.label}
                          href={shortcut.href}
                          prefetch
                          onClick={closeMobileMenu}
                          className="bs-liquid-control flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-2 text-[10px] font-bold text-[var(--foreground)]/80 transition-colors hover:text-[var(--primary)]"
                        >
                          <Icon className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                          {shortcut.label}
                        </Link>
                      );
                    })}
                  </div>

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
