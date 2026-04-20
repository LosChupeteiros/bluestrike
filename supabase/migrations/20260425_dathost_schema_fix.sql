-- =============================================================================
-- BlueStrike — Migration: fix dathost_servers for two-phase provisioning
-- =============================================================================

-- Allow null dathost_id during reservation phase (before Dathost match is created)
ALTER TABLE public.dathost_servers
  ALTER COLUMN dathost_id DROP NOT NULL;

-- Extend status constraint to include 'reserving' and 'error'
ALTER TABLE public.dathost_servers
  DROP CONSTRAINT IF EXISTS dathost_servers_status_check;

ALTER TABLE public.dathost_servers
  ADD CONSTRAINT dathost_servers_status_check
  CHECK (status IN ('reserving', 'provisioning', 'ready', 'live', 'finished', 'terminated', 'error'));

-- Columns added by previous migrations (safe to re-add)
ALTER TABLE public.dathost_servers
  ADD COLUMN IF NOT EXISTS raw_ip TEXT;

ALTER TABLE public.dathost_servers
  ADD COLUMN IF NOT EXISTS server_password TEXT;

-- Physical server ID for atomic reservation (prevents two matches claiming same server)
ALTER TABLE public.dathost_servers
  ADD COLUMN IF NOT EXISTS dathost_server_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS dathost_servers_server_id_unique
  ON public.dathost_servers (dathost_server_id)
  WHERE dathost_server_id IS NOT NULL;
