-- ============================================================================
-- Devius Portfolio — Iteración 25 ("Telemetría Propia")
-- Eventos custom propios (reemplazo gratuito de los Custom Events de Vercel Pro).
-- Idempotente: pegar en el SQL Editor de Supabase y correr una vez.
--
-- Seguridad:
--   * anon + authenticated pueden INSERTAR (los visitantes generan eventos).
--   * SOLO authenticated puede LEER (y borrar, para limpiar datos viejos).
--   * CHECKs anti-abuso: sólo nombres de evento conocidos y `properties`
--     pequeño (< 1 KB). Aunque alguien use la anon key directo contra la
--     API REST, no puede inventar eventos ni inflar la tabla con basura grande.
-- ============================================================================

create table if not exists public.telemetry_events (
  id          bigint generated always as identity primary key,
  event_name  text not null check (
                event_name in ('cv_downloaded', 'contact_message_sent', 'achievement_unlocked')
              ),
  properties  jsonb not null default '{}'::jsonb check (
                jsonb_typeof(properties) = 'object'
                and pg_column_size(properties) < 1024
              ),
  created_at  timestamptz not null default now()
);

comment on table public.telemetry_events is
  'Eventos custom del sitio (Iteración 25). INSERT público, SELECT/DELETE sólo autenticados. Sin datos personales.';

create index if not exists telemetry_events_name_created_idx
  on public.telemetry_events (event_name, created_at desc);

alter table public.telemetry_events enable row level security;

revoke all on public.telemetry_events from anon, authenticated;
grant insert on public.telemetry_events to anon, authenticated;
grant select, delete on public.telemetry_events to authenticated;

drop policy if exists "telemetry_insert_public" on public.telemetry_events;
create policy "telemetry_insert_public"
  on public.telemetry_events
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "telemetry_select_authenticated" on public.telemetry_events;
create policy "telemetry_select_authenticated"
  on public.telemetry_events
  for select
  to authenticated
  using (true);

drop policy if exists "telemetry_delete_authenticated" on public.telemetry_events;
create policy "telemetry_delete_authenticated"
  on public.telemetry_events
  for delete
  to authenticated
  using (true);

-- ── Agregación en la base (evita traer miles de filas al servidor) ──────────
-- SECURITY INVOKER: corre con los permisos de quien llama, así que RLS
-- sigue aplicando — un anónimo que la invoque no ve nada.
create or replace function public.get_telemetry_stats()
returns table (event_name text, total bigint, last_7d bigint, last_at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.event_name,
    count(*)                                                   as total,
    count(*) filter (where e.created_at >= now() - interval '7 days') as last_7d,
    max(e.created_at)                                          as last_at
  from public.telemetry_events e
  group by e.event_name;
$$;

create or replace function public.get_achievement_stats()
returns table (achievement_id text, title text, total bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.properties->>'id'                 as achievement_id,
    max(e.properties->>'title')         as title,
    count(*)                            as total
  from public.telemetry_events e
  where e.event_name = 'achievement_unlocked'
  group by e.properties->>'id'
  order by total desc;
$$;

revoke all on function public.get_telemetry_stats() from public, anon;
revoke all on function public.get_achievement_stats() from public, anon;
grant execute on function public.get_telemetry_stats() to authenticated;
grant execute on function public.get_achievement_stats() to authenticated;
