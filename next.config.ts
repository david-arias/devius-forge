import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      /**
       * Supabase Storage (Éter, Iteración 12 — preparación de backend).
       * `next/image` (usado en `QuestShowcase`, la cabecera de
       * `/quests/[slug]` y `ChapterMediaFrame`) bloquea por defecto
       * cualquier imagen que no sea del mismo origen o esté declarada acá
       * — sin esto, el día que `quest.media`/`chapterMedia` apunten a una
       * URL real del bucket `quest-images` (ver `src/lib/supabase/schema.ts`),
       * la imagen fallaría en silencio con un error 400 de `next/image`.
       * `<project-ref>` se reemplaza por el ref real del proyecto de
       * Supabase (mismo valor que `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`)
       * cuando exista.
       */
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/quest-images/**",
      },
    ],
  },
};

export default nextConfig;
