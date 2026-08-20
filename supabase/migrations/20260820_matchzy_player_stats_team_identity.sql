-- Persist the team identity with raw MatchZy stats so historical scoreboards
-- remain correct after a team is renamed.

alter table public.matchzy_player_stats
  add column if not exists team_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matchzy_player_stats_team_id_fkey'
      and conrelid = 'public.matchzy_player_stats'::regclass
  ) then
    alter table public.matchzy_player_stats
      add constraint matchzy_player_stats_team_id_fkey
      foreign key (team_id) references public.teams(id) on delete set null;
  end if;
end $$;

create index if not exists matchzy_player_stats_team_id_idx
  on public.matchzy_player_stats (team_id);

update public.matchzy_player_stats
set team_id = case upper(trim(team_name))
  when 'TESTE2' then '0f3d2b18-8a71-4c2c-b6a1-1c1f0d9e1001'::uuid
  when 'TESTE3' then '1a4e7c29-91b2-4f8a-9d33-2b2e1f0a1002'::uuid
  when 'TESTE4' then '2b5f8d3a-a2c3-45b9-8e44-3c3f2a1b1003'::uuid
  when 'TESTE5' then '3c6a9e4b-b3d4-46ca-9f55-4d4a3b2c1004'::uuid
  when 'TESTE6' then '4d7bae5c-c4e5-47db-af66-5e5b4c3d1005'::uuid
  when 'TESTE7' then '5e8cbf6d-d5f6-48ec-b077-6f6c5d4e1006'::uuid
  when 'TESTE8' then '6f9dc07e-e607-49fd-c188-7a7d6e5f1007'::uuid
  when 'TESTE9' then '7a0ed18f-f718-4afe-d299-8b8e7f6a1008'::uuid
  when 'TESTE10' then '8b1fe290-0829-4b0f-e3aa-9c9f8a7b1009'::uuid
  when 'TESTE11' then '9c20f3a1-193a-4c10-f4bb-a0a09b8c1010'::uuid
  when 'TESTE12' then 'ad31a4b2-2a4b-4d21-a5cc-b1b1ac9d1011'::uuid
  when 'TESTE13' then 'be42b5c3-3b5c-4e32-b6dd-c2c2bd0e1012'::uuid
  when 'TESTE14' then 'cf53c6d4-4c6d-4f43-c7ee-d3d3ce1f1013'::uuid
  when 'TESTE15' then 'd064d7e5-5d7e-4054-d8ff-e4e4df2a1014'::uuid
  when 'TESTE16' then 'f1c2a3b4-5d6e-4f78-9a0b-1c2d3e4f5a6b'::uuid
  else team_id
end
where team_id is null
  and upper(trim(team_name)) ~ '^TESTE([2-9]|1[0-6])$';

update public.matchzy_player_stats ms
set team_id = t.id
from public.matches m
join public.teams t on t.id in (m.team1_id, m.team2_id)
where ms.match_id = m.id
  and ms.team_id is null
  and lower(trim(ms.team_name)) in (lower(trim(t.name)), lower(trim(t.tag)));
