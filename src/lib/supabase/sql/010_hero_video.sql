-- ============================================================================
-- Devius Portfolio — Iteración 39 ("Scroll-Bound Video")
-- Video introductorio por Quest: el scroll de `/quests/[slug]` avanza el
-- video frame a frame (ver `QuestScrollVideoHero.tsx`).
-- Idempotente: pegar en el SQL Editor de Supabase y correr una vez.
-- Refleja `heroVideoUrl` en src/lib/demeter/schemas/quest.ts.
-- ============================================================================

alter table public.quests
  add column if not exists hero_video_url text;

comment on column public.quests.hero_video_url is
  'URL pública (bucket quest-images, carpeta <quest-id>/hero-video/) de un MP4/WebM corto, sin audio y con keyframes densos. NULL = sin Scroll-Bound Hero.';

-- El bucket `quest-images` se creó sin restricción de MIME (001_init.sql),
-- así que acepta video/mp4 y video/webm sin cambios. Si en tu proyecto le
-- pusiste `allowed_mime_types`, descomentá esto para sumar los de video:
-- update storage.buckets
--   set allowed_mime_types = array['image/png','image/jpeg','image/webp','image/avif','image/gif','video/mp4','video/webm']
--   where id = 'quest-images';
