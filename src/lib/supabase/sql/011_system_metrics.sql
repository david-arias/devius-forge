-- ============================================================================
-- Devius Portfolio — Iteración 41 ("Capacidad de la Forja")
-- Métricas de capacidad para el dashboard de /admin: peso de la base de
-- datos Postgres y del Storage (bucket por bucket), más las tablas más
-- pesadas del esquema `public`.
--
-- Idempotente: pegar en el SQL Editor de Supabase y correr una vez.
-- (Se numera 011 porque 010 ya es `010_hero_video.sql`.)
--
-- Seguridad:
--  - `security definer`: corre con los permisos del dueño (postgres), que
--    es quien puede leer `storage.objects` completo y `pg_database_size`.
--  - Aun así, SÓLO un usuario autenticado (el admin del CMS) obtiene
--    datos: `auth.role()` se valida adentro, y además se revoca EXECUTE
--    a `anon`/`public` y se concede sólo a `authenticated`.
--  - `set search_path = ''` + nombres totalmente calificados: evita el
--    secuestro de funciones por search_path (recomendación del linter de
--    Supabase para toda función SECURITY DEFINER).
-- ============================================================================

create or replace function public.get_system_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if (select auth.role()) is distinct from 'authenticated' then
    raise exception 'get_system_metrics: sólo disponible para usuarios autenticados'
      using errcode = '42501';
  end if;

  select jsonb_build_object(
    -- 1. Tamaño total de la base (incluye índices, TOAST y catálogos del sistema).
    'db_bytes', pg_catalog.pg_database_size(pg_catalog.current_database()),

    -- 2. Peso del Storage: suma de metadata->>'size' de todos los objetos.
    'storage_bytes', coalesce((
      select sum((o.metadata ->> 'size')::bigint)
      from storage.objects o
    ), 0),
    'storage_objects', (select count(*) from storage.objects),

    -- Desglose por bucket (hoy sólo `quest-images`, pero no se asume).
    'buckets', coalesce((
      select jsonb_agg(b order by b.bytes desc)
      from (
        select o.bucket_id as id,
               count(*) as objects,
               coalesce(sum((o.metadata ->> 'size')::bigint), 0) as bytes
        from storage.objects o
        group by o.bucket_id
      ) b
    ), '[]'::jsonb),

    -- Top 5 tablas de `public` por peso total (datos + índices + TOAST).
    'top_tables', coalesce((
      select jsonb_agg(t order by t.bytes desc)
      from (
        select c.relname as name,
               pg_catalog.pg_total_relation_size(c.oid) as bytes
        from pg_catalog.pg_class c
        join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'
        order by pg_catalog.pg_total_relation_size(c.oid) desc
        limit 5
      ) t
    ), '[]'::jsonb),

    'measured_at', pg_catalog.now()
  ) into result;

  return result;
end;
$$;

comment on function public.get_system_metrics() is
  'Iteración 41 — capacidad de BD y Storage para el dashboard /admin. Sólo authenticated.';

revoke all on function public.get_system_metrics() from public;
revoke all on function public.get_system_metrics() from anon;
grant execute on function public.get_system_metrics() to authenticated;
