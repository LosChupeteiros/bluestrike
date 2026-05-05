create table if not exists public.tournament_registration_intents (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  captain_profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'cancelled', 'expired', 'failed')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_amount integer not null default 0,
  payment_method text check (payment_method in ('pix')),
  mp_payment_id text,
  payment_reference text not null,
  pix_qr_code text,
  pix_qr_code_base64 text,
  pix_expires_at timestamptz,
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists tournament_registration_intents_tournament_idx
  on public.tournament_registration_intents (tournament_id, status, expires_at);

create index if not exists tournament_registration_intents_captain_idx
  on public.tournament_registration_intents (captain_profile_id, tournament_id, created_at desc);

create unique index if not exists tournament_registration_intents_open_team_key
  on public.tournament_registration_intents (tournament_id, team_id)
  where status in ('pending', 'paid');

create unique index if not exists tournament_registration_intents_payment_reference_key
  on public.tournament_registration_intents (payment_reference);

create unique index if not exists tournament_registration_intents_mp_payment_key
  on public.tournament_registration_intents (mp_payment_id)
  where mp_payment_id is not null;

drop trigger if exists tournament_registration_intents_set_updated_at on public.tournament_registration_intents;
create trigger tournament_registration_intents_set_updated_at
  before update on public.tournament_registration_intents
  for each row execute procedure public.set_updated_at();

alter table public.tournament_registration_intents enable row level security;
