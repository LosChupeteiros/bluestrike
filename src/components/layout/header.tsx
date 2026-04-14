"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Trophy,
  ChevronDown,
  Bell,
  User,
  LayoutDashboard,
  LogOut,
  Shield,
  Swords,
} from "lucide-react";

const navLinks = [
  { href: "/tournaments", label: "Campeonatos" },
  { href: "/ranking", label: "Ranking" },
];

// Mock auth state — replace with real session
const MOCK_USER = null as null | { name: string; avatar?: string; isAdmin?: boolean };

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const user = MOCK_USER;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

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
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--primary)] shadow-md group-hover:shadow-[0_0_16px_rgba(0,200,255,0.5)] transition-shadow">
              <Swords className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-black tracking-tight">
              Blue<span className="text-[var(--primary)]">Strike</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "text-[var(--primary)] bg-[var(--primary)]/10"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <button className="relative p-2 rounded-md hover:bg-[var(--secondary)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--primary)] rounded-full" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-black font-bold text-xs">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.name[0].toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-medium">{user.name}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", userMenuOpen && "rotate-180")} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl py-1 z-50">
                      <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--secondary)] transition-colors">
                        <LayoutDashboard className="w-4 h-4 text-[var(--muted-foreground)]" />
                        Dashboard
                      </Link>
                      <Link href="/dashboard/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--secondary)] transition-colors">
                        <User className="w-4 h-4 text-[var(--muted-foreground)]" />
                        Meu Perfil
                      </Link>
                      {user.isAdmin && (
                        <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--secondary)] transition-colors text-[var(--primary)]">
                          <Shield className="w-4 h-4" />
                          Admin
                        </Link>
                      )}
                      <div className="h-px bg-[var(--border)] my-1" />
                      <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Entrar</Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="sm" variant="gradient">Começar agora</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-[var(--secondary)] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]/98 backdrop-blur-md">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-[var(--primary)] bg-[var(--primary)]/10"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-red-400">
                    <LogOut className="w-4 h-4" /> Sair
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="w-full">
                    <Button variant="outline" size="sm" className="w-full">Entrar</Button>
                  </Link>
                  <Link href="/auth/login" className="w-full">
                    <Button size="sm" variant="gradient" className="w-full">Começar agora</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
