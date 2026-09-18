"use client";

import { Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Button, ForgeStatusScreen } from "@/components/hefesto/ui";

interface ErrorPageProps {
  error: Error & { digest?: string };
  /** Next 16.3+: vuelve a pedir los datos y re-renderiza el segmento. */
  retry?: () => void;
  /** Versión anterior (sin re-fetch). Se usa sólo si `retry` no existe. */
  reset?: () => void;
}

/**
 * Error boundary global de las rutas públicas — Hades, Iteración 23.
 * Vive DENTRO del root layout: Navbar/Footer siguen visibles, así el
 * visitante nunca queda en un callejón sin salida. Errores del propio
 * layout raíz los atrapa `global-error.tsx`.
 *
 * En producción Next.js no expone el mensaje de errores del servidor
 * (sólo `digest`): se muestra el digest como "código de runa" para poder
 * cruzarlo con los logs de Vercel.
 */
export default function ErrorPage({ error, retry, reset }: ErrorPageProps) {
  const [pending, startTransition] = useTransition();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    console.error("[Hades] Error capturado por app/error.tsx", error);
  }, [error]);

  function tryAgain() {
    setAttempts((n) => n + 1);
    startTransition(() => {
      (retry ?? reset)?.();
    });
  }

  return (
    <main className="relative flex flex-1 flex-col">
      <ForgeStatusScreen
        code="500"
        eyebrow="Interferencia mágica detectada"
        title="El fuego de la Forja ha parpadeado"
        description={
          attempts >= 2
            ? "La llama sigue inestable. Puede ser algo pasajero de nuestro lado — volvé en unos minutos o regresá al inicio."
            : "Algo se enfrió mientras forjábamos esta página. Avivá las brasas e intentémoslo otra vez."
        }
        footnote={
          error.digest ? (
            <p>
              Código de runa: <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-parchment-muted">{error.digest}</code>
            </p>
          ) : null
        }
      >
        <Button variant="cta" onClick={tryAgain} disabled={pending} className="gap-2 px-6 py-3">
          <RotateCcw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
          {pending ? "Reavivando…" : "Intentar de nuevo"}
        </Button>
        <Link href="/">
          <Button variant="secondary" className="gap-2 px-6 py-3">
            <Home className="h-4 w-4" aria-hidden />
            Volver al inicio
          </Button>
        </Link>
      </ForgeStatusScreen>
    </main>
  );
}
