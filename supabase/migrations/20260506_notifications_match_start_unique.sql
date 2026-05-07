-- Idempotency for match_start notifications: same profile + same link only once.
-- Allows safely re-running setTeamsAssigned / advanceWinner without duplicate inserts.
create unique index if not exists notifications_match_start_unique
  on public.notifications (profile_id, link)
  where type = 'match_start';
