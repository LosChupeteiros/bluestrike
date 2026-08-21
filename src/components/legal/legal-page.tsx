import Link from "next/link";
import { ChevronLeft, FileText, Info, ScrollText, ShieldCheck } from "lucide-react";
import type { LegalBlock, LegalDocument } from "@/lib/legal";
import { cn } from "@/lib/utils";

function Block({ block }: { block: LegalBlock }) {
  if (block.kind === "paragraph") {
    return (
      <p className="max-w-[68ch] text-[15px] leading-7 text-[var(--muted-foreground)]">
        {block.text}
      </p>
    );
  }

  if (block.kind === "list") {
    return (
      <ul className="max-w-[68ch] space-y-2.5">
        {block.items?.map((item, index) => (
          <li key={index} className="flex gap-3 text-[15px] leading-7 text-[var(--muted-foreground)]">
            <span
              className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rotate-45 bg-[var(--primary)]/70"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.kind === "note") {
    return (
      <div className="flex max-w-[68ch] gap-3 rounded-xl border border-[var(--primary)]/25 bg-[var(--primary)]/[0.05] px-4 py-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden="true" />
        <p className="text-[14px] leading-6 text-[var(--foreground)]/85">{block.text}</p>
      </div>
    );
  }

  // Tabela — rola sozinha no mobile em vez de estourar a página
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/40">
            {block.columns?.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted-foreground)]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows?.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-[var(--border)] last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    "px-4 py-3 align-top text-[13px] leading-6",
                    cellIndex === 0
                      ? "font-bold text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)]"
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LegalPage({ document }: { document: LegalDocument }) {
  const Icon = document.slug === "privacy" ? ShieldCheck : ScrollText;
  const otherHref = document.slug === "privacy" ? "/terms" : "/privacy";
  const otherLabel = document.slug === "privacy" ? "Termos de Uso" : "Política de Privacidade";

  return (
    <div className="bs-page pb-24 pt-28">
      <div className="bs-shell">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        {/* ── Cabeçalho ── */}
        <header className="relative overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] p-6 sm:p-9">
          <span
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[56px] border-[var(--primary)]/8"
            aria-hidden="true"
          />

          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="bs-eyebrow">
                <Icon className="h-4 w-4" /> {document.eyebrow}
              </p>
              <h1 className="bs-display mt-4">{document.title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
                {document.subtitle}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--border)] bg-black/20 px-3 py-1.5 text-[11px] font-bold text-[var(--muted-foreground)]">
                  Em vigor desde {document.effectiveDate}
                </span>
                <span className="rounded-full border border-[var(--border)] bg-black/20 px-3 py-1.5 text-[11px] font-bold text-[var(--muted-foreground)]">
                  Atualizado em {document.lastUpdated}
                </span>
              </div>
            </div>

            {/* Resumo honesto — o que o documento diz, em 4 linhas */}
            <div className="bs-inset p-4 lg:col-span-5">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                Em resumo
              </p>
              <ul className="space-y-2.5">
                {document.summary.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[13px] leading-6 text-[var(--foreground)]/85">
                    <span
                      className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3.5 border-t border-[var(--border)] pt-3 text-[11px] leading-5 text-[var(--muted-foreground)]">
                O resumo é um atalho de leitura. O que vale juridicamente é o texto completo abaixo.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          {/* ── Índice ── */}
          <nav aria-label="Índice do documento" className="lg:col-span-3">
            <div className="lg:sticky lg:top-28">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                Índice
              </p>
              <ol className="space-y-0.5">
                {document.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="flex gap-2.5 rounded-lg px-2.5 py-2 text-[13px] leading-5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--primary)]/[0.06] hover:text-[var(--primary)]"
                    >
                      <span className="font-mono text-[11px] opacity-60">{section.number}</span>
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>

              <Link
                href={otherHref}
                className="mt-5 flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-[13px] font-bold transition-colors hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
              >
                <FileText className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden="true" />
                Ler {otherLabel}
              </Link>
            </div>
          </nav>

          {/* ── Corpo ── */}
          <article className="lg:col-span-9">
            <div className="space-y-12">
              {document.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28">
                  <h2 className="mb-4 flex items-baseline gap-3 text-xl font-black tracking-tight sm:text-2xl">
                    <span className="font-mono text-sm text-[var(--primary)]">{section.number}</span>
                    {section.title}
                  </h2>
                  <div className="space-y-4">
                    {section.blocks.map((block, index) => (
                      <Block key={index} block={block} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-14 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
              <p className="text-[13px] leading-6 text-[var(--muted-foreground)]">
                Ficou alguma dúvida sobre este documento? Fale com a gente —
                preferimos explicar antes do que resolver depois.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={otherHref}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-xs font-black transition-colors hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {otherLabel}
                </Link>
                <Link
                  href="/tournaments"
                  className="inline-flex min-h-10 items-center rounded-xl border border-[var(--primary)]/40 bg-[var(--primary)]/10 px-4 text-xs font-black text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/16"
                >
                  Ver campeonatos
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
