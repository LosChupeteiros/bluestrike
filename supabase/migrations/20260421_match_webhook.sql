-- =============================================================================
-- BlueStrike — Migration: per-match webhook secret for CS2 server callbacks
-- =============================================================================

-- Unique token per match. Dathost is configured with:
--   authorization_header = 'Bearer {webhook_secret}'
-- The webhook URL is /api/webhooks/cs2/{bluestrike_match_id}
alter table public.matches
  add column if not exists webhook_secret text;

-- dathost_match_id stores the ID of the match created via Dathost CS2 Match API
alter table public.matches
  add column if not exists dathost_match_id text unique;

create index if not exists matches_dathost_match_idx
  on public.matches (dathost_match_id)
  where dathost_match_id is not null;

-- Backfill webhook_secret for any existing matches (gen_random_uuid returns a UUID string)
update public.matches
  set webhook_secret = gen_random_uuid()::text
  where webhook_secret is null;
