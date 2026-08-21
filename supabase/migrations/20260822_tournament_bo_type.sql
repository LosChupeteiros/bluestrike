-- =============================================================================
-- BlueStrike — Formato de série (BO1/BO3) escolhido pelo admin
-- =============================================================================
-- Defaults preservam o comportamento anterior: rodadas normais em BO1 e
-- final em BO3 (que era hardcoded em buildSeededSingleEliminationBracket).

alter table public.tournaments
  add column if not exists bo_type integer not null default 1;

alter table public.tournaments
  add column if not exists final_bo_type integer not null default 3;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tournaments_bo_type_check' and conrelid = 'public.tournaments'::regclass
  ) then
    alter table public.tournaments
      add constraint tournaments_bo_type_check check (bo_type in (1,3,5));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'tournaments_final_bo_type_check' and conrelid = 'public.tournaments'::regclass
  ) then
    alter table public.tournaments
      add constraint tournaments_final_bo_type_check check (final_bo_type in (1,3,5));
  end if;
end; $$;
