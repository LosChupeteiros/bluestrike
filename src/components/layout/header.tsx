"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Menu, Shield, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import HeaderElo from "./header-elo";
import NotificationBell from "./notification-bell";

const navLinks = [
  { href: "/live", label: "Ao vivo", live: true },
  { href: "/teams", label: "Times", live: false },
  { href: "/players", label: "Players", live: false },
  { href: "/ranking", label: "Ranking", live: false },
  { href: "/skins", label: "Skins", live: false },
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

const SPRING = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.7 };

function FaceitMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--color-faceit)" />
      <path d="M8 8h16v4.5H12.5v3H22v4.5h-9.5V24H8V8z" fill="white" />
    </svg>
  );
}

/**
 * O PNG do logo tem fundo preto esfumaçado. `mix-blend-mode: screen` descarta
 * esse preto contra a superfície escura e deixa só o raio — sem a caixa feia
 * em volta da marca, e sem precisar reexportar o asset.
 */
function StrikeMark() {
  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
      <Image
        src="/assets/logo/bluestrike_logo_header.png"
        alt=""
        width={36}
        height={36}
        priority
        className="logo-blend h-9 w-9 object-contain transition-transform duration-700 [transition-timing-function:var(--ease-out-expo)] group-hover:scale-110"
      />
    </span>
  );
}

// ── Campeonatos dropdown ─────────────────────────────────────────────────────

function CampeonatosMenu({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = pathname.startsWith("/tournaments") || pathname.startsWith("/faceit");

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 220);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  const lanes = [
    {
      href: "/tournaments",
      title: "BlueStrike",
      note: "Skins liberadas · Premiação PIX",
      accent: "var(--color-strike)",
      mark: (
        <Image
          src="/assets/logo/bluestrike_logo_header.png"
          alt=""
          width={26}
          height={26}
          className="logo-blend h-6 w-6 object-contain"
        />
      ),
      tag: "!ws",
    },
    {
      href: "/faceit",
      title: "FACEIT",
      note: "Anti-cheat · Premiações maiores",
      accent: "var(--color-faceit)",
      mark: <FaceitMark size={24} />,
      tag: null,
    },
  ];

  return (
    <div className="relative" onMouseEnter={() => { cancelClose(); setOpen(true); }} onMouseLeave={scheduleClose}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-300",
          isActive ? "text-strike" : "text-ink hover:text-strike"
        )}
      >
        Campeonatos
        <ChevronDown
          className={cn("h-3 w-3 transition-transform duration-300 [transition-timing-function:var(--ease-out-quint)]", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.14 } }}
            transition={SPRING}
            style={{ zIndex: "var(--z-dropdown)" }}
            className="absolute left-1/2 top-full w-[21rem] -translate-x-1/2 pt-3"
          >
            <div className="frost overflow-hidden rounded-2xl p-1.5 shadow-[0_28px_60px_-24px_rgba(0,0,0,0.9)]">
              {lanes.map((lane) => (
                <Link
                  key={lane.href}
                  href={lane.href}
                  prefetch
                  onClick={() => { setOpen(false); onNavigate?.(); }}
                  className="group/lane relative flex items-center gap-3 rounded-xl px-3 py-3 transition-colors duration-300 hover:bg-white/[0.05]"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-all duration-300"
                    style={{
                      borderColor: `color-mix(in oklab, ${lane.accent} 28%, transparent)`,
                      background: `color-mix(in oklab, ${lane.accent} 10%, transparent)`,
                    }}
                  >
                    {lane.mark}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 font-display text-sm font-bold tracking-tight text-ink">
                      {lane.title}
                      {lane.tag && (
                        <span
                          className="rounded px-1 py-px font-mono text-[10px] font-semibold"
                          style={{ color: lane.accent, background: `color-mix(in oklab, ${lane.accent} 14%, transparent)` }}
                        >
                          {lane.tag}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-3">{lane.note}</span>
                  </span>

                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full opacity-40 transition-all duration-300 group-hover/lane:opacity-100"
                    style={{ background: lane.accent }}
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Desktop nav with a sliding indicator ─────────────────────────────────────

function DesktopNav({ pathname }: { pathname: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const activeHref = navLinks.find(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
  )?.href;
  const highlighted = hovered ?? activeHref;

  return (
    <nav className="hidden items-center lg:flex" onMouseLeave={() => setHovered(null)}>
      <CampeonatosMenu pathname={pathname} />

      {navLinks.map((link) => {
        const isActive = link.href === activeHref;
        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch
            onMouseEnter={() => setHovered(link.href)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-300",
              isActive ? "text-strike" : "text-ink hover:text-strike"
            )}
          >
            {highlighted === link.href && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute inset-0 -z-10 rounded-full bg-white/[0.07]"
                transition={reduceMotion ? { duration: 0 } : SPRING}
                aria-hidden="true"
              />
            )}
            {link.live && (
              <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
                <span className="animate-breathe absolute inline-flex h-full w-full rounded-full bg-live" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
              </span>
            )}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Mobile sheet ─────────────────────────────────────────────────────────────

function MobileSheet({
  user,
  authState,
  pathname,
  onClose,
}: {
  user: HeaderUser | null;
  authState: "ready" | "loading";
  pathname: string;
  onClose: () => void;
}) {
  const allLinks = [
    { href: "/tournaments", label: "Campeonatos BlueStrike", live: false },
    { href: "/faceit", label: "Campeonatos FACEIT", live: false },
    ...navLinks,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, transition: { duration: 0.16 } }}
      transition={SPRING}
      className="mt-2 lg:hidden"
    >
      <div className="frost overflow-hidden rounded-2xl p-2 shadow-[0_28px_60px_-24px_rgba(0,0,0,0.9)]">
        {allLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              onClick={onClose}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
                isActive ? "bg-strike/10 text-strike" : "text-ink hover:bg-white/[0.05] hover:text-strike"
              )}
            >
              {link.live && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-live" aria-hidden="true" />}
              {link.label}
            </Link>
          );
        })}

        <div className="my-2 h-px bg-line" />

        {user ? (
          <div className="space-y-2 p-1">
            <Link
              href={`/profile/${user.publicId}`}
              prefetch
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 px-3 py-3"
            >
              <Avatar className="h-10 w-10 ring-1 ring-strike/25">
                <AvatarImage src={user.steamAvatarUrl ?? undefined} alt="" />
                <AvatarFallback className="font-display font-bold text-strike">
                  {user.displayName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{user.displayName}</span>
                <HeaderElo initialElo={user.elo} faceitLevel={user.faceitLevel} faceitElo={user.faceitElo} />
              </span>
            </Link>

            {user.isAdmin && (
              <Link href="/admin" prefetch onClick={onClose} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  Admin
                </Button>
              </Link>
            )}

            <Button asChild variant="ghost" size="sm" className="w-full justify-start">
              <a href="/api/auth/logout" onClick={onClose}>Sair</a>
            </Button>
          </div>
        ) : authState === "loading" ? (
          <div className="p-1">
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
        ) : (
          <div className="p-1">
            <Link href="/auth/login" prefetch onClick={onClose} className="block">
              <Button variant="gradient" size="sm" className="w-full">Entrar com Steam</Button>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────

export default function Header({ user, authState = "ready" }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const routes = ["/", "/tournaments", "/teams", "/players", "/ranking", "/auth/login", "/faceit"];
    if (user) {
      routes.push(`/profile/${user.publicId}`, "/cadastro");
    }

    const prefetchRoutes = () => routes.forEach((route) => router.prefetch(route));

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetchRoutes);
      return () => window.cancelIdleCallback(id);
    }

    const timeout = setTimeout(prefetchRoutes, 250);
    return () => clearTimeout(timeout);
  }, [router, user]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className="fixed inset-x-0 top-0 px-3 pt-3 sm:px-4"
      style={{ zIndex: "var(--z-sticky)" }}
    >
      <div className="mx-auto max-w-[1360px]">
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-full border px-3 transition-all duration-500 [transition-timing-function:var(--ease-out-quint)] sm:px-4",
            scrolled
              ? "h-14 border-white/[0.08] bg-void/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_16px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl backdrop-saturate-150"
              : "h-16 border-transparent bg-transparent"
          )}
        >
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <StrikeMark />
            <span className="font-display text-lg font-extrabold tracking-[-0.03em] text-ink">
              Blue<span className="text-strike">Strike</span>
            </span>
          </Link>

          <DesktopNav pathname={pathname} />

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            {user ? (
              <>
                <NotificationBell enabled />
                <Link
                  href={`/profile/${user.publicId}`}
                  prefetch
                  className="group flex items-center gap-2.5 rounded-full border border-line bg-surface/50 py-1 pl-1 pr-3.5 transition-all duration-300 [transition-timing-function:var(--ease-out-quint)] hover:border-strike/40 hover:bg-surface"
                >
                  <Avatar className="h-8 w-8 ring-1 ring-strike/25">
                    <AvatarImage src={user.steamAvatarUrl ?? undefined} alt="" />
                    <AvatarFallback className="font-display text-xs font-bold text-strike">
                      {user.displayName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="block max-w-[130px] truncate text-[13px] font-semibold leading-tight text-ink transition-colors group-hover:text-strike">
                      {user.displayName}
                    </span>
                    <HeaderElo initialElo={user.elo} faceitLevel={user.faceitLevel} faceitElo={user.faceitElo} />
                  </span>
                </Link>

                {user.isAdmin && (
                  <Link href="/admin" prefetch>
                    <Button variant="ghost" size="icon-sm" aria-label="Admin">
                      <Shield className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                )}

                <Button asChild variant="ghost" size="sm">
                  <a href="/api/auth/logout">Sair</a>
                </Button>
              </>
            ) : authState === "loading" ? (
              <>
                <div className="skeleton h-9 w-40 rounded-lg" />
              </>
            ) : (
              <Link href="/auth/login" prefetch>
                <Button variant="gradient" size="sm">Entrar com Steam</Button>
              </Link>
            )}
          </div>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-white/[0.06] hover:text-ink lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <MobileSheet
              user={user}
              authState={authState}
              pathname={pathname}
              onClose={() => setMobileOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
