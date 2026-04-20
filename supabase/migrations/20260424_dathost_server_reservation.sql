-- =============================================================================
-- BlueStrike — Migration: atomic server reservation + connection string column
-- =============================================================================

-- Track which physical Dathost server is reserved for a match.
-- Unique constraint prevents two matches from claiming the same server.
alter table public.dathost_servers
  add column if not exists dathost_server_id text;

create unique index if not exists dathost_servers_server_id_unique
  on public.dathost_servers (dathost_server_id)
  where dathost_server_id is not null;

-- connect_string may already exist — add if not present
alter table public.dathost_servers
  add column if not exists connect_string text;
