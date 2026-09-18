import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { AdminSidebar, AdminToastHost } from "@/components/hefesto/ui";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Layout del panel admin PROTEGIDO — Eleuthia, Iteración 14 ("La Forja
 * Oculta"). Vive en el route group `(protected)` a propósito: un route
 * group no agrega segmento a la URL (`/admin/character` sigue siendo
 * `/admin/character`, no `/admin/protected/character`), pero SÍ aísla este
 * layout de `src/app/admin/login/page.tsx` — esa ruta es hermana de
 * `(protected)`, no está anidada dentro, así que nunca hereda esta
 * verificación de sesión. Sin este aislamiento, este layout envolvería
 * también a `/admin/login` y un visitante sin sesión quedaría en un loop
 * de redirect infinito (login → sin sesión → redirect a login → …).
 *
 * `proxy.ts` ya redirige a `/admin/login` cuando no hay sesión antes
 * de que esto se ejecute; este layout repite la verificación server-side
 * como segunda línea de defensa ("defense in depth" — si el `matcher` del
 * middleware alguna vez se desconfigura, esto sigue bloqueando el acceso).
 *
 * Server Component: puede `await` la sesión directo, sin loading state ni
 * flash de contenido protegido.
 */
export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-obsidian sm:flex-row">
      <AdminSidebar />
      <main className="flex-1 px-4 py-8 sm:px-10 sm:py-12">{children}</main>
      {/* Host único de Toasts del CMS (Minerva/Hefesto, Iteración 15) — cualquier
          Server Action de guardar/eliminar/duplicar en /admin/* empuja acá. */}
      <AdminToastHost />
    </div>
  );
}
