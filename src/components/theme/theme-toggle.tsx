"use client";

import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem("bluestrike-theme", nextTheme);
  }

  return (
    <button
      aria-label="Alternar tema de cores"
      className={`bs-liquid-control inline-flex h-11 items-center justify-center gap-2 rounded-full text-[var(--foreground)] transition-[color,border-color,background-color] hover:text-[var(--primary)] ${compact ? "w-11" : "px-4"}`}
      onClick={toggleTheme}
      title="Alternar tema de cores"
      type="button"
    >
      <Sun className="bs-theme-sun h-4 w-4" />
      <Moon className="bs-theme-moon h-4 w-4" />
      {!compact && <><span className="bs-theme-light-label text-xs font-bold">Claro</span><span className="bs-theme-dark-label text-xs font-bold">Escuro</span></>}
    </button>
  );
}
