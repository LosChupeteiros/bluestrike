export default function TournamentDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 animate-pulse rounded-2xl bg-[var(--secondary)]" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-2/3 animate-pulse rounded bg-[var(--secondary)]" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--secondary)]" />
          </div>
          <div className="hidden h-10 w-32 animate-pulse rounded-lg bg-[var(--secondary)] sm:block" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="h-12 animate-pulse rounded-xl bg-[var(--secondary)]" />
            <div className="h-64 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]" />
            <div className="h-48 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]" />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="h-72 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]" />
            <div className="h-40 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
