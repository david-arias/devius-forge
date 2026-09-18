import { ImageResponse } from "next/og";

/**
 * opengraph-image.tsx — Apolo (auditoría 2026-09-15, hallazgo de Medio
 * Impacto: "no genera preview" al compartir el link). Next.js sirve este
 * archivo automáticamente en `/opengraph-image` para OG *y* Twitter Card
 * (referenciado explícitamente en ambos bloques de `metadata`, en
 * `layout.tsx`, para mayor claridad). Se genera con `next/og` (Satori) en
 * request-time — nada de exportar un PNG a mano ni mantenerlo sincronizado
 * con la paleta si ésta cambia en `globals.css`/`MASTER.md`.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Devius — Hybrid Forgemaster";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0f",
          backgroundImage:
            "radial-gradient(ellipse 60% 60% at 8% 10%, rgba(232,196,104,0.20), transparent 60%), radial-gradient(ellipse 55% 55% at 96% 14%, rgba(52,211,153,0.24), transparent 60%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.12)",
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 64, color: "#e8c468" }}>D</span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            color: "#e9e6df",
            letterSpacing: "-0.01em",
          }}
        >
          Devius
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 40,
            fontWeight: 600,
            backgroundImage: "linear-gradient(90deg, #e8c468, #34d399)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Hybrid Forgemaster
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 26,
            color: "#a8a5b0",
          }}
        >
          UX/UI Design · Frontend Engineering · Portafolio interactivo
        </div>
      </div>
    ),
    { ...size }
  );
}
