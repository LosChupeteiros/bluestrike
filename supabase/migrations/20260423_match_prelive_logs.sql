-- =============================================================================
-- BlueStrike — Migration: pre_live status + Dathost API logs
-- =============================================================================

-- Add pre_live to matches status constraint
-- (Supabase/Postgres: drop old constraint, add new one)
alter table public.matches
  drop constraint if exists matches_status_check;

alter table public.matches
  add constraint matches_status_check
  check (status in ('pending','veto','pre_live','live','finished','walkover','cancelled'));

-- Dathost API request/response log per match (admin-visible console)
create table if not exists public.dathost_api_logs (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid references public.matches(id) on delete cascade,
  method       text not null,
  url          text not null,
  request_body jsonb,
  response_status integer,
  response_body   jsonb,
  error_message   text,
  created_at   timestamptz not null default now()
);

create index if not exists dathost_api_logs_match_idx on public.dathost_api_logs (match_id, created_at desc);

alter table public.dathost_api_logs enable row level security;

-- Admins can read logs (enforced at app level via isAdmin check)
drop policy if exists "dathost_logs_select_admin" on public.dathost_api_logs;
create policy "dathost_logs_select_admin" on public.dathost_api_logs
  for select using (true);
