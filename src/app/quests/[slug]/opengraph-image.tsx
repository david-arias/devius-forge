import { ImageResponse } from "next/og";
import { getQuests } from "@/lib/demeter/queries/quests";

/**
 * opengraph-image.tsx — Apolo, Iteración 30 ("Fix de Modales, Impresión
 * Dual y OG Dinámico"). Versión por-Quest de `src/app/opengraph-image.tsx`
 * (Iteración 9, "OG estático de marca") — Next.js sirve esto en
 * `/quests/[slug]/opengraph-image` y lo referencia solo en el `<head>` de
 * esa ruta dinámica en particular, sin tocar `layout.tsx` (que sigue
 * apuntando al OG genérico para el resto del sitio).
 *
 * Por qué esto es un "flex" real y no cosmético: compartir el link de una
 * Quest puntual en Slack/LinkedIn/Twitter mostraba SIEMPRE la misma
 * tarjeta genérica de marca ("Devius — Hybrid Forgemaster") sin importar
 * qué proyecto era — cero contexto para quien recibe el link. Ahora cada
 * Quest tiene su propia tarjeta con su título, su `accentColor` (mismo
 * degradado que ya usa `QuestShowcase`/`Card`, coherencia visual con el
 * sitio) y hasta 4 badges de tecnología.
 *
 * `getQuests()` (Deméter) sin `includeDrafts` — mismo criterio que
 * `generateStaticParams` de `page.tsx` en esta misma carpeta: nunca
 * `getQuestsForView()` (usa `draftMode()`/`next/headers`, no disponible
 * en la generación estática de imágenes OG) y nunca se expone una Quest
 * sin publicar en una tarjeta social pública.
 */
export const alt = "Devius — Quest";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * `withAlpha()` — Apolo, Iteración 34 (fix del build roto en Vercel).
 * `ImageResponse` (`next/og`) NO renderiza con un browser real: usa
 * Satori, que convierte JSX+CSS a SVG con un parser de CSS bastante más
 * chico que el de un motor real — no entiende funciones CSS modernas
 * como `color-mix()` (que sí se usa sin problema en el resto del sitio,
 * `Card.tsx`/`QuestCard.tsx`/`page.tsx`, porque esos SÍ corren en un
 * browser). El error de build ("Unexpected token type: function") es
 * exactamente Satori tropezando con `color-mix(in srgb, ...)`. Acá se
 * resuelve la mezcla a mano en JS (hex → `rgba()`) ANTES de mandarlo al
 * `style`, así Satori sólo ve un color plano que sabe interpretar.
 */
function withAlpha(hex: string, alphaPercent: number): string {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alphaPercent / 100})`;
}

export async function generateStaticParams() {
  const quests = await getQuests();
  return quests.map((quest) => ({ slug: quest.id }));
}

interface OpengraphImageProps {
  params: Promise<{ slug: string }>;
}

export default async function QuestOpengraphImage({ params }: OpengraphImageProps) {
  const { slug } = await params;
  const quests = await getQuests();
  const quest = quests.find((q) => q.id === slug);

  // Slug inválido/Quest despublicada entre el build y el fetch de un bot
  // social: se cae a una tarjeta genérica de marca en vez de un 500.
  if (!quest) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a0f",
            fontFamily: "sans-serif",
            fontSize: 64,
            fontWeight: 700,
            color: "#e9e6df",
          }}
        >
          Devius
        </div>
      ),
      { ...size }
    );
  }

  const techBadges = quest.tech.slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#0a0a0f",
          backgroundImage: `radial-gradient(ellipse 55% 60% at 100% 0%, ${withAlpha(quest.accentColor, 30)}, transparent 60%), radial-gradient(ellipse 50% 50% at 0% 100%, ${withAlpha(quest.accentColor, 18)}, transparent 60%)`,
          fontFamily: "sans-serif",
        }}
      >
        {/* Header: wordmark de marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <span style={{ fontSize: 22, color: "#e8c468" }}>D</span>
          </div>
          <span style={{ fontSize: 24, letterSpacing: "0.02em", color: "#a8a5b0" }}>
            DEVIUS <span style={{ color: "#4a4a58" }}>·</span> Quest
          </span>
        </div>

        {/* Título de la Quest */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 980,
          }}
        >
          <span
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: quest.accentColor,
              marginBottom: 20,
            }}
          >
            Caso de estudio
          </span>
          <span
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.08,
              color: "#e9e6df",
              letterSpacing: "-0.01em",
            }}
          >
            {quest.title}
          </span>
        </div>

        {/* Badges de tecnología */}
        {techBadges.length > 0 && (
          <div style={{ display: "flex", gap: 12 }}>
            {techBadges.map((tech) => (
              <div
                key={tech}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: `1px solid ${withAlpha(quest.accentColor, 45)}`,
                  backgroundColor: withAlpha(quest.accentColor, 12),
                  color: "#e9e6df",
                  fontSize: 22,
                }}
              >
                {tech}
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
