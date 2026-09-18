-- ============================================================================
-- Devius Portfolio — `is_published` universal para Quests e Inventory
-- (Deméter, Iteración 16 — "CMS V2")
-- ============================================================================
-- Pegar en el SQL Editor de supabase.com y correr una sola vez (idempotente:
-- `add column if not exists` + el backfill sólo toca filas `status = 'draft'`,
-- así que correrlo dos veces no cambia nada la segunda vez).
--
-- Motivo (auditoría 2026-09-16): Skill Tree ya tenía un booleano
-- (`unlocked`) que funciona como estado de borrador; Quests sólo tenía
-- `status = 'draft'` (agregado en `003_quest_draft_status.sql`, Iteración
-- 15) e Inventory no tenía ningún mecanismo. Esta migración unifica el
-- concepto "visible públicamente" con un booleano `is_published` en las
-- tres tablas de colección — `unlocked` de `skill_tree` NO se renombra
-- (ver el comentario en `src/lib/demeter/schemas/quest.ts` sobre por qué:
-- es la misma idea con otro nombre histórico, renombrarlo es más riesgo
-- que beneficio para una columna que el sitio público ya lee).
-- ============================================================================


-- ── 1. Quests: nueva columna + backfill desde el viejo `status = 'draft'` ──

alter table public.quests
  add column if not exists is_published boolean not null default true;

update public.quests
  set is_published = false
  where status = 'draft';

-- `status` deja de aceptar `'draft'` — esa pregunta la responde
-- `is_published` ahora. Cualquier fila que siga en `'draft'` después del
-- backfill de arriba (no debería quedar ninguna) se normaliza a
-- `'completed'` antes de aplicar el constraint más estricto, para que
-- este `alter table` no falle.
update public.quests
  set status = 'completed'
  where status = 'draft';

do $$
declare
  existing_constraint text;
begin
  select con.conname into existing_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'quests'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%status%';

  if existing_constraint is not null then
    execute format('alter table public.quests drop constraint %I', existing_constraint);
  end if;
end $$;

alter table public.quests
  add constraint quests_status_check
  check (status in ('completed', 'in-progress'));

comment on column public.quests.is_published is
  'true = visible en /quests y /quests/[slug]. Reemplaza al viejo status=''draft'' (ver 003_quest_draft_status.sql, ahora obsoleto). Ver getQuests() en src/lib/demeter/queries/quests.ts.';


-- ── 2. Inventory: misma columna, sin backfill (no existía ningún estado de borrador antes) ──

alter table public.inventory
  add column if not exists is_published boolean not null default true;

comment on column public.inventory.is_published is
  'true = visible en el Inventario público. Mismo concepto que quests.is_published y skill_tree.unlocked. Ver getInventory() en src/lib/demeter/queries/inventory.ts.';
