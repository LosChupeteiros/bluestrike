"use client";

import { useState } from "react";
import { Check, Copy, Webhook } from "lucide-react";
import type { MatchWebhookInfo } from "@/lib/matches";

const EVENT_LABELS: Record<string, string> = {
  booting_server:           "Servidor iniciando",
  loading_map:              "Carregando mapa",
  server_ready_for_players: "Servidor pronto",
  all_players_connected:    "Todos conectados",
  match_started:            "Partida iniciada",
  match_canceled:           "Partida cancelada",
  match_ended:              "Partida encerrada ✦",
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 break-all font-mono text-xs text-[var(--foreground)]">{value}</code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded p-1 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          aria-label="Copiar"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default function WebhookInfoPanel({ webhookInfo }: { webhookInfo: MatchWebhookInfo }) {
  return (
    <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="mb-5 flex items-center gap-2">
        <Webhook className="h-4 w-4 text-[var(--primary)]" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--primary)]">
          Webhook CS2 — Dathost
        </h3>
      </div>

      <div className="mb-5 space-y-3">
        <CopyField label="Authorization Header" value={webhookInfo.authorizationHeader} />
        <CopyField label="URL Base do Webhook" value={webhookInfo.webhookUrl} />
      </div>

      <div>
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          URLs por evento — configure no Dathost
        </div>
        <div className="space-y-2">
          {Object.entries(webhookInfo.events).map(([event, url]) => (
            <div
              key={event}
              className={`rounded-lg border p-2.5 ${
                event === "match_ended"
                  ? "border-[var(--primary)]/25 bg-[var(--primary)]/5"
                  : "border-[var(--border)] bg-[var(--secondary)]"
              }`}
            >
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                {EVENT_LABELS[event] ?? event}
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all font-mono text-[10px] text-[var(--foreground)]">{url}</code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(url)}
                  className="shrink-0 rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  aria-label="Copiar URL"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-[var(--muted-foreground)]">
        Configure cada URL no campo correspondente da partida criada via API do Dathost.
        Adicione o <strong className="text-[var(--foreground)]">Authorization Header</strong> acima em todas as configurações de webhook.
        O evento <strong className="text-[var(--foreground)]">match_ended</strong> registra o resultado e avança o bracket automaticamente.
      </p>
    </div>
  );
}
