"use client";

import { KeyRound, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Button, Card } from "@/components/hefesto/ui";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * /admin/login — Eleuthia/Éter, Iteración 14 ("La Forja Oculta"). Puerta de
 * entrada de la fragua oculta: email + password contra
 * `supabase.auth.signInWithPassword`. Client Component (necesita el
 * cliente de navegador de Supabase, que persiste la sesión en
 * localStorage — ver `src/lib/supabase/client.ts`); `proxy.ts` lee
 * esa misma sesión vía cookie en la siguiente request para dejar pasar a
 * `/admin`.
 *
 * Accesibilidad (CRITICAL, mismo estándar que el resto del sitio):
 *  - Inputs con `<label>` real asociado (no placeholder-como-label).
 *  - Foco visible heredado del `:focus-visible` global (gold ring).
 *  - Región de error `role="alert" aria-live="assertive"` — se anuncia
 *    apenas aparece, sin robar el foco del input.
 *  - Botón deshabilitado + texto de estado ("Entrando…") durante el
 *    request, para no dejar doble-submit ni estado ambiguo a un lector de
 *    pantalla.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Credenciales inválidas. Verificá el correo y la contraseña.");
        setIsSubmitting(false);
        return;
      }

      // Iteración 23: volver a la pantalla que el proxy interceptó (`?next=`),
      // sólo si es una ruta interna del panel (evita open-redirects).
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
      router.push(safeNext);
      router.refresh();
    } catch {
      setError("No se pudo conectar con Supabase. Probá de nuevo en unos segundos.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center px-4 py-24 sm:px-8">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span
            aria-hidden
            className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-gold-deep/70 bg-gold-glow/10 text-gold-glow"
          >
            <KeyRound className="h-5 w-5" />
          </span>
          <h1 className="font-display text-xl text-parchment">La Forja Oculta</h1>
          <p className="mt-1 text-sm text-parchment-muted">
            Acceso restringido — panel de administración
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={emailId} className="text-sm font-medium text-parchment">
              Correo
            </label>
            <div className="relative">
              <Mail
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-parchment-muted"
              />
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-white/10 bg-obsidian/60 py-2 pl-9 pr-3 text-sm text-parchment placeholder:text-parchment-muted/50 focus-visible:border-gold-glow/50"
                placeholder="tu@correo.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={passwordId} className="text-sm font-medium text-parchment">
              Contraseña
            </label>
            <div className="relative">
              <KeyRound
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-parchment-muted"
              />
              <input
                id={passwordId}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-white/10 bg-obsidian/60 py-2 pl-9 pr-3 text-sm text-parchment placeholder:text-parchment-muted/50 focus-visible:border-gold-glow/50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div role="alert" aria-live="assertive" className="min-h-[1.25rem] text-sm text-danger">
            {error}
          </div>

          <Button type="submit" variant="cta" disabled={isSubmitting} className="mt-1 w-full">
            {isSubmitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
