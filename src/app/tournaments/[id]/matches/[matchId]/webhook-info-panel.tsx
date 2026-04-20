"use client";

import { useState } from "react";
import { Check, Copy, Webhook } from "lucide-react";
import type { MatchWebhookInfo } from "@/lib/matches";

function CopyField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <span className={`flex-1 break-all text-xs text-[var(--foreground)] ${mono ? "font-mono" : ""}`}>
          {value}
        </span>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded p-1 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          aria-label="Copiar"
        >
          {copied
            ? <Check className="h-3.5 w-3.5 text-green-400" />
            : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default function WebhookInfoPanel({ webhookInfo }: { webhookInfo: MatchWebhookInfo }) {
  const enabledEventsJson = JSON.stringify(webhookInfo.enabledEvents);

  return (
    <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="mb-5 flex items-center gap-2">
        <Webhook className="h-4 w-4 text-[var(--primary)]" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--primary)]">
          Webhook CS2 — Dathost
        </h3>
      </div>

      {/* Step 1 */}
      <div className="mb-5">
        <p className="mb-3 text-xs font-semibold text-[var(--muted-foreground)]">
          1. Configure a URL única no campo <code className="font-mono text-[var(--foreground)]">webhooks.event_url</code>
        </p>
        <CopyField label="event_url" value={webhookInfo.webhookUrl} />
      </div>

      {/* Step 2 */}
      <div className="mb-5">
        <p className="mb-3 text-xs font-semibold text-[var(--muted-foreground)]">
          2. Adicione o header de autenticação em <code className="font-mono text-[var(--foreground)]">webhooks.authorization_header</code>
        </p>
        <CopyField label="authorization_header" value={webhookInfo.authorizationHeader} />
      </div>

      {/* Step 3 */}
      <div className="mb-5">
        <p className="mb-3 text-xs font-semibold text-[var(--muted-foreground)]">
          3. Habilite os eventos em <code className="font-mono text-[var(--foreground)]">webhooks.enabled_events</code>
        </p>
        <CopyField label="enabled_events (array JSON)" value={enabledEventsJson} />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {webhookInfo.enabledEvents.map((e) => (
            <span
              key={e}
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${
                e === "match_ended"
                  ? "border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)]"
              }`}
            >
              {e}
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/60 p-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
        <strong className="text-[var(--foreground)]">Como funciona:</strong> O Dathost envia o payload completo para a URL acima a cada evento.
        O BlueStrike lê o último evento do array <code className="font-mono">events[]</code> e age em consequência.
        Ao receber <strong className="text-[var(--primary)]">match_ended</strong>, o resultado é registrado automaticamente,
        os stats dos jogadores são salvos e o bracket avança para a próxima fase.
      </div>
    </div>
  );
}
