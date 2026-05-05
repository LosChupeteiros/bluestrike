-- =============================================================================
-- BlueStrike — Integração MatchZy
-- =============================================================================

-- Vincula cada partida BlueStrike ao matchid usado pelo MatchZy (enviado no JSON config)
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS matchzy_match_id bigint UNIQUE;

CREATE INDEX IF NOT EXISTS matches_matchzy_match_id_idx
  ON public.matches (matchzy_match_id);

-- Tabela de idempotência para webhooks nativos do MatchZy.
-- payload_hash (SHA-256) garante que o mesmo evento não seja processado duas vezes.
CREATE TABLE IF NOT EXISTS public.matchzy_webhook_events (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          uuid        REFERENCES public.matches(id) ON DELETE SET NULL,
  matchzy_match_id  bigint      NOT NULL,
  event_type        text        NOT NULL,
  payload           jsonb       NOT NULL,
  payload_hash      text        NOT NULL,
  received_at       timestamptz NOT NULL DEFAULT NOW(),
  processed_at      timestamptz,
  processing_status text        NOT NULL DEFAULT 'pending',
  error_message     text,
  UNIQUE (payload_hash)
);

CREATE INDEX IF NOT EXISTS matchzy_webhook_events_lookup_idx
  ON public.matchzy_webhook_events (matchzy_match_id, event_type);
