"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Shield, SprayCan, Swords, UserRound, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import HeaderElo from "./header-elo";

interface UserMenuUser {
  displayName: string;
  steamAvatarUrl: string | null;
  elo: number;
  publicId: number;
  isAdmin: boolean;
  faceitLevel?: number | null;
  faceitElo?: number | null;
}

interface UserMenuProps {
  user: UserMenuUser;
  pathname: string;
}

interface MenuItem {
  href: string;
  label: string;
  hint: string;
  icon: React.ElementType;
}

export default function UserMenu({ user, pathname }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const profilePath = `/profile/${user.publicId}`;
  const isActive = pathname.startsWith("/profile") || pathname.startsWith("/skins");

  const items: MenuItem[] = [
    {
      href: profilePath,
      label: "Meu perfil",
      hint: "ELO, rank e cadastro",
      icon: UserRound,
    },
    {
      href: `${profilePath}?tab=matches`,
      label: "Minhas partidas",
      hint: "Historico e resultados",
      icon: Swords,
    },
    {
      href: `${profilePath}?tab=teams`,
      label: "Meus times",
      hint: "Lineup e convites",
      icon: Users,
    },
    {
      href: "/skins",
      label: "Minhas skins",
      hint: "Loadout CT e TR",
      icon: SprayCan,
    },
  ];

  // Fecha ao clicar fora ou no Esc — o hover sozinho nao cobre teclado nem touch.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 300);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "group flex items-center gap-3 rounded-xl border bg-[var(--card)] px-3 py-2 transition-all cursor-pointer",
          open || isActive
            ? "border-[var(--primary)]/40 bg-[var(--secondary)]"
            : "border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--secondary)]"
        )}
      >
        <Avatar className="h-9 w-9 ring-1 ring-[var(--primary)]/20">
          <AvatarImage src={user.steamAvatarUrl ?? undefined} alt={user.displayName} />
          <AvatarFallback className="font-black text-[var(--primary)]">
            {user.displayName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 text-left">
          <div
            className={cn(
              "max-w-[160px] truncate text-sm font-semibold transition-colors",
              open && "text-[var(--primary)]"
            )}
          >
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
        className={cn(
          "absolute right-0 top-full w-72 pt-2 z-50",
          "transition-all duration-200 ease-out",
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        {/* Seta apontando para o trigger */}
        <div className="mr-5 ml-auto w-3 h-1.5 overflow-hidden">
          <div className="w-3 h-3 bg-[var(--border)] rotate-45 translate-y-1.5 translate-x-0.5" />
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/60 overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />

          <div className="p-2 space-y-0.5">
            <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Minha area
            </p>

            {items.map(({ href, label, hint, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                prefetch
                onClick={() => setOpen(false)}
                className="group/item relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 hover:bg-[var(--primary)]/8 overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-[var(--primary)]/5 to-transparent" />

                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/25 transition-all duration-150 group-hover/item:bg-[var(--primary)]/15 group-hover/item:ring-[var(--primary)]/50">
                  <Icon className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                </div>

                <div className="relative min-w-0">
                  <p className="text-sm font-bold text-[var(--foreground)] transition-colors duration-150 group-hover/item:text-[var(--primary)]">
                    {label}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{hint}</p>
                </div>
              </Link>
            ))}
          </div>

          {user.isAdmin && (
            <div className="border-t border-[var(--border)] p-2">
              <Link
                href="/admin"
                prefetch
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-[var(--secondary)]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)] ring-1 ring-[var(--border)]">
                  <Shield className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold">Painel admin</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                    Campeonatos e premiacoes
                  </p>
                </div>
              </Link>
            </div>
          )}

          <div className="border-t border-[var(--border)] p-2">
            <a
              href="/api/auth/logout"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors duration-150 hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair da conta
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
