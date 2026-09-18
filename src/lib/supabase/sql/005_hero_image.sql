-- ============================================================================
-- Devius Portfolio — Iteración 19 ("El Efecto WOW")
-- Retrato principal del Hero, editable desde /admin/character.
-- Idempotente: pegar en el SQL Editor de Supabase y correr una vez.
-- Refleja `heroImageUrl` en src/lib/demeter/schemas/character.ts.
-- ============================================================================

alter table public.character_sheet
  add column if not exists hero_image_url text;

comment on column public.character_sheet.hero_image_url is
  'URL pública (bucket quest-images, carpeta hero/) del retrato del Hero. Idealmente PNG sin fondo. NULL = sin imagen.';
