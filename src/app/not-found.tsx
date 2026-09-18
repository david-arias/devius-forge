import { Home, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button, ForgeStatusScreen } from "@/components/hefesto/ui";

export const metadata: Metadata = {
  title: "Ruta perdida",
  robots: { index: false },
};

/**
 * 404 — Hades, Iteración 23. No existía un `not-found.tsx` propio (se usaba
 * el de Next.js); ahora comparte `ForgeStatusScreen` con `error.tsx`.
 * Lo usa también `notFound()` en `/quests/[slug]`.
 */
export default function NotFound() {
  return (
    <main className="relative flex flex-1 flex-col">
      <ForgeStatusScreen
        variant="lost"
        code="404"
        eyebrow="Mapa sin trazar"
        title="Esta ruta no figura en ningún pergamino"
        description="La Quest que buscás fue movida, archivada o nunca existió. Volvé a la base y elegí otra aventura."
      >
        <Link href="/">
          <Button variant="cta" className="gap-2 px-6 py-3">
            <Home className="h-4 w-4" aria-hidden />
            Volver al inicio
          </Button>
        </Link>
        <Link href="/#quests">
          <Button variant="secondary" className="gap-2 px-6 py-3">
            <ScrollText className="h-4 w-4" aria-hidden />
            Ver Quests
          </Button>
        </Link>
      </ForgeStatusScreen>
    </main>
  );
}
