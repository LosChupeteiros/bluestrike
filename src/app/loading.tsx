export default function Loading() {
  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--secondary)]" />
          <div className="h-10 w-72 animate-pulse rounded-2xl bg-[var(--secondary)]" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-[var(--secondary)]" />
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="h-40 animate-pulse rounded-2xl bg-[var(--secondary)]" />
              <div className="h-5 w-2/3 animate-pulse rounded-full bg-[var(--secondary)]" />
              <div className="h-4 w-full animate-pulse rounded-full bg-[var(--secondary)]" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-[var(--secondary)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
