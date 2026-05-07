"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, Swords, Trophy, Info, Mail, ChevronRight } from "lucide-react";
import { useNotifications, type ClientNotification } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  enabled: boolean;
}

const TYPE_META: Record<ClientNotification["type"], { icon: typeof Bell; color: string }> = {
  match_start: { icon: Swords, color: "text-[var(--primary)]" },
  checkin_reminder: { icon: Info, color: "text-yellow-400" },
  result: { icon: Trophy, color: "text-green-400" },
  system: { icon: Info, color: "text-[var(--muted-foreground)]" },
  team_invite: { icon: Mail, color: "text-orange-400" },
};

function formatRelative(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function NotificationBell({ enabled }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(enabled);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (!enabled) return null;

  const hasUnread = unreadCount > 0;

  function handleItemClick(n: ClientNotification) {
    if (!n.read) markAsRead(n.id);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notificações${hasUnread ? ` (${unreadCount} não lida${unreadCount > 1 ? "s" : ""})` : ""}`}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] transition-all",
          "hover:border-[var(--primary)]/40 hover:bg-[var(--secondary)]",
          hasUnread && "border-[var(--primary)]/40 animate-pulse-glow"
        )}
      >
        <Bell className={cn("h-5 w-5", hasUnread ? "text-[var(--primary)]" : "text-[var(--foreground)]")} />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--destructive)] px-1 text-[10px] font-black leading-none text-white shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-[360px] origin-top-right overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl backdrop-blur-md",
            "animate-fade-in"
          )}
          style={{ zIndex: 60 }}
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div>
              <div className="text-sm font-bold">Notificações</div>
              {hasUnread && (
                <div className="text-[11px] text-[var(--muted-foreground)]">
                  {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
                </div>
              )}
            </div>
            {hasUnread && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
              >
                <Check className="h-3 w-3" />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <Bell className="mb-3 h-10 w-10 text-[var(--muted-foreground)] opacity-30" />
                <div className="text-sm font-semibold">Tudo em dia</div>
                <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  Avisaremos quando suas partidas ficarem disponíveis.
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {notifications.map((n) => {
                  const Meta = TYPE_META[n.type] ?? TYPE_META.system;
                  const Icon = Meta.icon;
                  const inner = (
                    <div
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--secondary)]",
                        !n.read && "border-l-2 border-[var(--primary)] bg-[var(--primary)]/5"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)]",
                          Meta.color
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className={cn("text-sm font-bold leading-tight", !n.read && "text-[var(--primary)]")}>
                            {n.title}
                          </div>
                          <div className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                            {formatRelative(n.created_at)}
                          </div>
                        </div>
                        {n.message && (
                          <div className="mt-0.5 text-xs text-[var(--muted-foreground)] line-clamp-2">{n.message}</div>
                        )}
                      </div>
                      {n.link && <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />}
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link href={n.link} prefetch onClick={() => handleItemClick(n)} className="block">
                          {inner}
                        </Link>
                      ) : (
                        <button type="button" onClick={() => handleItemClick(n)} className="block w-full text-left">
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
