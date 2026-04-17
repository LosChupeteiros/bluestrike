-- Faceit championship prizes: admin-managed prize breakdown per championship
create table if not exists public.faceit_prizes (
  id               uuid primary key default gen_random_uuid(),
  championship_id  text unique not null,
  prize_total      numeric not null default 0,
  prize_first      numeric not null default 0,
  prize_second     numeric not null default 0,
  prize_third      numeric not null default 0,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
