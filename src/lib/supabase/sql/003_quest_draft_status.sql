-- ============================================================================
-- Devius Portfolio — estado "draft" para Quests (Deméter, Iteración 15 —
-- "Refinamiento de la Forja Oculta")
-- ============================================================================
-- Pegar en el SQL Editor de supabase.com y correr una sola vez (idempotente:
-- el bloque `do $$ ... $$` busca el constraint de check existente sobre
-- `status` por su definición, no por nombre fijo, así que corre bien tanto
-- sobre una tabla creada con el constraint inline de `001_init.sql` como
-- sobre una ya migrada por este mismo archivo).
--
-- Motivo: la auditoría del CMS (2026-09-15) pidió un tercer estado además
-- de `completed`/`in-progress` para poder preparar una Quest nueva (o una
-- duplicada, ver Hallazgo de Alto Impacto "no se puede duplicar") sin que
-- aparezca a medio terminar en `/quests`. `QuestSchema` (quest.ts) y
-- `QuestFormSchema` (quest-form-schema.ts) ya aceptan `"draft"` en el
-- enum de dominio; esto sincroniza el `check` constraint de la base para
-- que no rechace ese valor.
-- ============================================================================

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
  check (status in ('completed', 'in-progress', 'draft'));

comment on column public.quests.status is
  'completed | in-progress | draft. "draft" NUNCA se muestra en el sitio público — ver getQuests() en src/lib/demeter/queries/quests.ts (filtra por defecto, admin pasa includeDrafts: true).';
