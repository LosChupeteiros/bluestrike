-- =============================================================================
-- BlueStrike - unique bracket slots per tournament
-- =============================================================================

-- Safe cleanup: remove duplicate bracket slots only when the duplicate row has
-- not started, finished, or been linked to external match/server state.
with ranked as (
  select
    id,
    row_number() over (
      partition by tournament_id, round, match_index
      order by created_at asc, id asc
    ) as slot_rank
  from public.matches
  where tournament_id is not null
    and status in ('pending', 'cancelled', 'walkover')
    and started_at is null
    and finished_at is null
    and dathost_match_id is null
    and matchzy_match_id is null
)
delete from public.matches m
using ranked r
where m.id = r.id
  and r.slot_rank > 1;

create unique index if not exists matches_tournament_round_match_index_key
  on public.matches (tournament_id, round, match_index);
