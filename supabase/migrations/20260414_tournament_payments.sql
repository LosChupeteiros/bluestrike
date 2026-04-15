alter table public.tournaments
  add column if not exists entry_fee integer not null default 0;

alter table public.tournament_registrations
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded'));

alter table public.tournament_registrations
  add column if not exists payment_amount integer not null default 0;

alter table public.tournament_registrations
  add column if not exists payment_reference text;

alter table public.tournament_registrations
  add column if not exists payment_method text
    check (payment_method in ('pix'));
