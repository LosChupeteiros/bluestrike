export type LiveStatus = "checking" | "live" | "offline";

interface LiveStatusBadgeProps {
  status: LiveStatus;
}

export default function LiveStatusBadge({ status }: LiveStatusBadgeProps) {
  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--secondary)]">
        <span className="w-2 h-2 rounded-full bg-[var(--border)] animate-pulse" />
        <span className="text-[var(--muted-foreground)] text-[11px] font-black tracking-widest">
          VERIFICANDO
        </span>
      </div>
    );
  }

  if (status === "live") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--destructive)]/10 border border-[var(--destructive)]/30">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--destructive)] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--destructive)]" />
        </span>
        <span className="text-[var(--destructive)] text-[11px] font-black tracking-widest">AO VIVO</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--secondary)]">
      <span className="w-2 h-2 rounded-full bg-[var(--muted-foreground)]/30" />
      <span className="text-[var(--muted-foreground)]/40 text-[11px] font-black tracking-widest">OFFLINE</span>
    </div>
  );
}
