-- =============================================================================
-- BlueStrike — Chave PIX do jogador (premiação)
-- =============================================================================
-- Dado pessoal: leitura restrita ao próprio dono e a administradores.
-- Nenhuma rota pública devolve esse campo.

alter table public.profiles
  add column if not exists pix_key_type text;

alter table public.profiles
  add column if not exists pix_key text;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_pix_key_type_check' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_pix_key_type_check
      check (pix_key_type is null or pix_key_type in ('cpf','phone','email','random'));
  end if;
end; $$;

comment on column public.profiles.pix_key is
  'Chave PIX para recebimento de premiação. NUNCA expor em rota pública — apenas dono e admin.';
