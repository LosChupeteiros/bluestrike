"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Filtros que vivem na URL e atualizam a lista enquanto o usuário digita.
 * Usa `router.replace` + `useTransition`: o servidor refaz a lista sem recarregar
 * a página nem perder o foco do input.
 */
export function useLiveFilters(options?: { resetKeys?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const resetKeysKey = (options?.resetKeys ?? ["page"]).join(",");

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const resetKeys = resetKeysKey.split(",");
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }

      // Trocar um filtro sempre volta para a primeira página
      const changedFilter = Object.keys(updates).some((key) => !resetKeys.includes(key));
      if (changedFilter) {
        for (const key of resetKeys) params.delete(key);
      }

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, resetKeysKey, router, searchParams]
  );

  return { setParams, isPending, searchParams };
}

interface LiveSearchInputProps {
  /** Nome do parâmetro na URL */
  param: string;
  initialValue: string;
  placeholder: string;
  label: string;
  className?: string;
  debounceMs?: number;
  onPendingChange?: (pending: boolean) => void;
}

export function LiveSearchInput({
  param,
  initialValue,
  placeholder,
  label,
  className,
  debounceMs = 280,
  onPendingChange,
}: LiveSearchInputProps) {
  const { setParams, isPending } = useLiveFilters();
  const [value, setValue] = useState(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushed = useRef(initialValue);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function push(next: string) {
    if (next === lastPushed.current) return;
    lastPushed.current = next;
    setParams({ [param]: next || null });
  }

  function handleChange(next: string) {
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => push(next.trim()), debounceMs);
  }

  function clear() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setValue("");
    push("");
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      <label className="sr-only" htmlFor={`live-search-${param}`}>
        {label}
      </label>

      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" aria-hidden="true" />
        ) : (
          <Search className="h-4 w-4" aria-hidden="true" />
        )}
      </span>

      <input
        id={`live-search-${param}`}
        type="search"
        autoComplete="off"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (timerRef.current) clearTimeout(timerRef.current);
            push(value.trim());
          }
        }}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-[var(--border)] bg-black/20 pl-11 pr-10 text-sm outline-none transition-colors focus:border-[var(--primary)]/55 focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25 [&::-webkit-search-cancel-button]:hidden"
      />

      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-white/5 hover:text-[var(--foreground)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

interface LiveSelectProps {
  param: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

export function LiveSelect({ param, label, value, options, className }: LiveSelectProps) {
  const { setParams } = useLiveFilters();

  return (
    <label className={cn("block rounded-xl border border-[var(--border)] bg-black/20 px-4 py-2", className)}>
      <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => setParams({ [param]: event.target.value || null })}
        className="mt-1 w-full min-h-8 bg-transparent text-sm font-bold outline-none [&>option]:bg-[#0b111b]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Chips de filtro (status, modalidade, etc.) que aplicam na hora. */
export function LiveChips({
  param,
  value,
  options,
  className,
}: {
  param: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  const { setParams } = useLiveFilters();

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => setParams({ [param]: option.value || null })}
            className={cn(
              "min-h-10 rounded-full border px-4 text-xs font-black transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/45",
              isActive
                ? "border-[var(--primary)]/55 bg-[var(--primary)]/12 text-[var(--primary)]"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/35 hover:text-[var(--foreground)]"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
