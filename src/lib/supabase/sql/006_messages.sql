-- ============================================================================
-- Devius Portfolio — Iteración 21 ("Contacto Full-Stack")
-- Bandeja de mensajes del formulario de contacto del Footer.
-- Idempotente: pegar en el SQL Editor de Supabase y correr una vez.
--
-- Seguridad:
--   * anon + authenticated pueden INSERTAR (el formulario es público).
--   * SOLO authenticated (vos, desde el panel) puede LEER / BORRAR.
--   * Nadie puede UPDATE (un mensaje recibido no se reescribe).
--   * CHECKs de longitud en la base: aunque alguien salte el formulario y
--     pegue directo a la API REST con la anon key, no puede meter basura
--     gigante ni campos vacíos.
-- ============================================================================

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 2 and 80),
  email       text not null check (
                char_length(email) <= 254
                and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
              ),
  content     text not null check (char_length(btrim(content)) between 10 and 2000),
  created_at  timestamptz not null default now()
);

comment on table public.messages is
  'Mensajes del formulario de contacto (Footer). INSERT público, SELECT/DELETE sólo autenticados.';

create index if not exists messages_created_at_idx on public.messages (created_at desc);

alter table public.messages enable row level security;

-- Privilegios base (RLS filtra por encima de esto).
revoke all on public.messages from anon, authenticated;
grant insert on public.messages to anon, authenticated;
grant select, delete on public.messages to authenticated;

drop policy if exists "messages_insert_public" on public.messages;
create policy "messages_insert_public"
  on public.messages
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "messages_select_authenticated" on public.messages;
create policy "messages_select_authenticated"
  on public.messages
  for select
  to authenticated
  using (true);

drop policy if exists "messages_delete_authenticated" on public.messages;
create policy "messages_delete_authenticated"
  on public.messages
  for delete
  to authenticated
  using (true);
