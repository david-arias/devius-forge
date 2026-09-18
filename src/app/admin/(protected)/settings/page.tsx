import type { Metadata } from "next";
import { getSettings } from "@/lib/demeter/queries/settings";
import { SettingsForm } from "@/lib/minerva/forms/SettingsForm";

export const metadata: Metadata = { title: "Ajustes", robots: { index: false } };

/**
 * `/admin/settings` — Iteración 22 ("Ajustes Globales"). Lee la fila
 * única de `public.global_settings` (misma lectura cacheada que usa el
 * sitio público) y la pasa como valores iniciales al formulario.
 */
export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-1 text-xs uppercase tracking-[0.3em] text-gold-glow">Configuración</p>
      <h1 className="mb-2 font-display text-2xl text-parchment">Ajustes Globales</h1>
      <p className="mb-8 text-sm text-parchment-muted">
        Enlaces que aparecen en el Navbar, el Hero, el Footer y los datos estructurados (SEO) del sitio.
      </p>
      <SettingsForm initialValues={settings} />
    </div>
  );
}
