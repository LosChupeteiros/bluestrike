import { CompetitionPayoutFlow, MapVeto, SkinsUnlocked } from "./platform-widgets";

export default function PlatformGrid() {
  return (
    <section className="bs-section" data-reveal>
      <div className="bs-shell">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,.72fr)_minmax(22rem,.28fr)] lg:items-end">
          <div>
            <p className="bs-eyebrow">Operação integrada</p>
            <h2 className="type-h2 mt-4 max-w-[18ch]">A competição flui. Você foca no jogo.</h2>
          </div>
          <p className="type-body max-w-[46ch] lg:pb-1">
            Bracket, servidor, veto e pagamento compartilham o mesmo estado. Menos tarefas paralelas para o capitão, mais clareza para todo o time.
          </p>
        </div>

        <div className="bs-inset relative mt-14 overflow-hidden p-3 sm:p-5 lg:p-7">
          <div className="pointer-events-none absolute left-1/2 top-0 h-10 w-px bg-[var(--border)]" aria-hidden="true" />
          <div className="pointer-events-none absolute left-1/2 top-9 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[var(--primary)] shadow-[0_0_0_6px_color-mix(in_srgb,var(--primary)_8%,transparent)]" aria-hidden="true" />

          <div className="grid gap-4 pt-12 lg:grid-cols-12">
            <article className="bs-dark-card overflow-hidden p-1 lg:col-span-12">
              <CompetitionPayoutFlow />
            </article>
            <article className="bs-bento-card p-5 sm:p-7 lg:col-span-7">
              <MapVeto />
            </article>
            <article className="bs-dark-card overflow-hidden p-1 lg:col-span-5">
              <SkinsUnlocked />
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
