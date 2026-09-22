import type { Metadata } from "next";
import { Cinzel, Ubuntu } from "next/font/google";
import "./globals.css";
import { draftMode } from "next/headers";
import { SiteChrome } from "@/components/hefesto/sections";
import { getNavigationForView, getQuestsForView } from "@/lib/minerva";
import { type CommandPaletteQuest } from "@/components/hefesto/ui";
import { SITE_URL } from "@/lib/site";
import { SupabaseRuntimeConfig } from "@/components/eter/SupabaseRuntimeConfig";
import { readSupabaseEnv } from "@/lib/supabase/env";
import { Telemetry } from "@/components/poseidon/Telemetry";
import { getLocale } from "@/lib/i18n/get-locale";
import { getTranslations } from "@/lib/i18n/get-translations";
import { connection } from "next/server";

/** Poseidón, Iteración 24: la telemetría de Vercel sólo existe en builds de producción. */
const TELEMETRY_ENABLED = process.env.NODE_ENV === "production";

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

/**
 * Ubuntu — Iteración 39 (Hefesto, "Tipografía Híbrida"). Reemplaza a
 * Inter como tipografía de LECTURA (párrafos, descripciones de capítulos,
 * botones, badges, navegación). Se aplica una sola vez en `<body>`
 * (`font-ubuntu`) y todo lo demás la hereda; los títulos (`h1`–`h4`)
 * NO la heredan porque `globals.css` (`@layer base`) les fuerza
 * `var(--font-display)` (Cinzel) — así la Serif épica se conserva en
 * Hero, títulos de Quests y títulos de capítulos sin tocar cada uno.
 * Ubuntu no es variable en Google Fonts → los pesos van explícitos
 * (300/400/500/700 son los únicos que existen).
 */
const ubuntu = Ubuntu({
  // Nombre distinto al token de Tailwind (`--font-ubuntu`, globals.css)
  // para no crear una referencia circular `--font-ubuntu: var(--font-ubuntu)`.
  variable: "--font-ubuntu-google",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

// SITE_URL vive en `src/lib/site.ts` desde la Iteración 23 (env `NEXT_PUBLIC_SITE_URL`).
const SITE_TITLE = "Devius — Hybrid Forgemaster · Portafolio";
const SITE_DESCRIPTION =
  "Portafolio interactivo de Devius, Hybrid Forgemaster (UX/UI + Frontend): quests (casos de estudio), skill tree (experiencia) e inventario de tecnologías, con métricas reales de impacto.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · Devius",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Devius — Portafolio",
  keywords: [
    "Devius",
    "portafolio UX/UI",
    "frontend developer",
    "diseño de producto",
    "Next.js",
    "React",
    "case studies UX",
  ],
  authors: [{ name: "Devius", url: SITE_URL }],
  creator: "Devius",
  alternates: {
    canonical: "/",
    // Iteración 31 (Apolo, i18n): el sitio NO usa prefijos de ruta por
    // idioma (`/es/`, `/en/`) — el idioma se resuelve por cookie
    // (`devius-locale`, ver `lib/i18n/get-locale.ts`), así que las dos
    // versiones viven en la MISMA URL. Aun así declarar
    // `alternates.languages` le indica a Google que el contenido de esta
    // URL existe en más de un idioma (mejor que no decir nada), y
    // `x-default` cubre el caso de un visitante sin preferencia
    // detectada. Si en el futuro el i18n pasa a rutas segmentadas, esto
    // se actualiza para apuntar a URLs distintas por idioma.
    languages: {
      "es-CO": SITE_URL,
      "en-US": SITE_URL,
      "x-default": SITE_URL,
    },
    types: {
      // Iteración 29 (Apolo) — feed RSS de Quests publicadas, ver `src/app/feed.xml/route.ts`.
      "application/rss+xml": `${SITE_URL}/feed.xml`,
    },
  },
  openGraph: {
    type: "profile",
    url: SITE_URL,
    siteName: "Devius — Portafolio",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "es_ES",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Devius — Hybrid Forgemaster",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * RootLayout — Apolo: aquí viven los dos componentes estructurales nuevos,
 * Navbar (fijo) y Footer, envolviendo `children` (la única página del sitio
 * por ahora). `scroll-smooth` en `<html>` habilita el scroll suave al hacer
 * click en los anclas del Navbar; `prefers-reduced-motion` (ver globals.css)
 * ya lo desactiva automáticamente (`scroll-behavior: auto !important`).
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  // `await connection()` (Iteración 36, Minerva — fix DEFINITIVO del
  // "idioma estancado"): la Iteración 35 puso `unstable_noStore()` acá
  // pensando que forzaba render dinámico para todo el árbol — pero en
  // Next.js 16 (modelo "Dynamic I/O"), `unstable_noStore()` es un NOOP
  // durante la fase de prerender (`node_modules/next/dist/server/web/
  // spec-extension/unstable-no-store.js`: `case 'prerender': ... //
  // unstable_noStore() is a noop in Dynamic I/O. return;`). Resultado:
  // en build, Next igual prerenderizaba este layout como si fuera
  // estático (con `cookies()` resolviendo al valor default "es"), y esa
  // versión congelada es la que Vercel servía siempre, sin importar la
  // cookie `devius-locale` del visitante — de ahí el idioma "pegado".
  // `connection()` (`next/server`, el reemplazo oficial de
  // `unstable_noStore` a partir de Next 15+) NO es un noop en esa misma
  // fase: literalmente corta el prerender ahí ("prerendering stops
  // here", docs de Next) y obliga a que TODO lo que sigue — incluida
  // `getLocale()`/`getQuestsForView()` más abajo — corra en cada
  // request real. Puesto acá, en la raíz, cubre TODO el sitio de una vez
  // (Home, Navbar, Footer, Command Palette, y por herencia `/quests/[slug]`).
  await connection();

  // Iteración 29 (Apolo): la Paleta de Comandos (`CommandPalette.tsx`,
  // montada más abajo vía `SiteChrome`) necesita buscar entre las Quests
  // publicadas desde CUALQUIER ruta del sitio, no sólo `/` — por eso se
  // resuelven acá, en el único layout que envuelve todas las páginas,
  // en vez de en `src/app/page.tsx` (que sólo corre para la home).
  // `getQuestsForView()` ya filtra por publicadas salvo Draft Mode activo
  // (ver su docblock) — se reduce a la forma mínima que la paleta
  // necesita (`CommandPaletteQuest`) antes de pasarla hacia abajo.
  // Iteración 31 (Apolo/Minerva, i18n): una sola lectura de `getLocale()`
  // acá arriba (cookie `devius-locale`) — `getQuestsForView()` ya la lee
  // internamente para las Quests, y acá se vuelve a usar sólo para
  // `<html lang>`, que SÍ tiene que reflejar el idioma activo (a11y/SEO:
  // lectores de pantalla y buscadores confían en ese atributo).
  const [navigation, quests, locale, t] = await Promise.all([
    getNavigationForView(),
    getQuestsForView(),
    getLocale(),
    getTranslations(),
  ]);
  const commandPaletteQuests: CommandPaletteQuest[] = quests.map((quest) => ({
    id: quest.id,
    title: quest.title,
    summary: quest.summary,
  }));
  // Iteración 35 (fix del 500 global — "Functions cannot be passed directly
  // to Client Components"): `t.footer.credits` es una función
  // (`(year) => string`), y `footerT` cruza acá abajo hacia `SiteChrome`
  // ("use client"). RSC sólo serializa datos planos a través de esa
  // frontera — una función ahí tira el sitio entero. Se resuelve al
  // STRING final ACÁ (Server Component, único lugar donde puede correr la
  // función) antes de que `footerT` cruce el límite servidor→cliente.
  const footerT = { ...t.footer, credits: t.footer.credits(new Date().getFullYear()) };
  // Iteración 18 (APOLO — "El Puente Bifröst"): una sola lectura de
  // `draftMode()` acá arriba, pasada hacia abajo a `PreviewBanner` (que
  // la vuelve a leer ella misma, es un Server Component independiente) y
  // a `SiteChrome` → `Navbar` (para el offset `top-9`, ver su docblock).
  const { isEnabled: previewActive } = await draftMode();
  // Iteración 28: las credenciales de Supabase viajan al navegador acá
  // (payload del servidor) en vez de incrustarse en el bundle vía
  // `NEXT_PUBLIC_*` — ver `components/eter/SupabaseRuntimeConfig.tsx`.
  const supabaseEnv = readSupabaseEnv();

  // JSON-LD Person/ProfilePage (Apolo, auditoría 2026-09-15) — apunta a las
  // mismas redes reales que ya sirve `getNavigationForView` (Deméter/Minerva),
  // así que nunca se desincroniza de lo que ve el visitante en el Navbar/Footer.
  const sameAs = navigation.socialLinks
    .filter((link) => link.kind !== "email")
    .map((link) => link.href);
  const emailLink = navigation.socialLinks.find((link) => link.kind === "email");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name: "Devius",
        jobTitle: "UX/UI Designer & Frontend Engineer",
        url: SITE_URL,
        ...(emailLink && { email: emailLink.href.replace(/^mailto:/, "") }),
        ...(sameAs.length > 0 && { sameAs }),
      },
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/#profile`,
        url: SITE_URL,
        name: SITE_TITLE,
        description: SITE_DESCRIPTION,
        mainEntity: { "@id": `${SITE_URL}/#person` },
        inLanguage: locale,
      },
    ],
  };

  return (
    <html
      lang={locale}
      className={`${cinzel.variable} ${ubuntu.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-obsidian text-parchment font-ubuntu">
        <SupabaseRuntimeConfig url={supabaseEnv.url} anonKey={supabaseEnv.anonKey} />
        {/* Atmósfera de la Forja — fondo + grano, dominio de Hefesto (ver globals.css) */}
        <div aria-hidden className="forge-atmosphere" />
        <div aria-hidden className="noise-overlay" />
        {/* SiteChrome (Apolo, Iteración 15) decide si este chrome público
            (Navbar/Footer/CustomCursor/Logros) se renderiza o no: en
            `/admin/*` NO se renderiza nada de esto — ver SiteChrome.tsx
            para el porqué (auditoría 2026-09-15, doble navegación en el CMS). */}
        <SiteChrome navigation={navigation} previewActive={previewActive} quests={commandPaletteQuests} footerT={footerT}>
          {children}
        </SiteChrome>
        {/* JSON-LD estático, generado server-side a partir de datos propios (no HTML de usuario) — ver comentario arriba. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Vercel Web Analytics + Speed Insights (Iteración 24) — ver components/poseidon/Telemetry.tsx. */}
        {TELEMETRY_ENABLED && <Telemetry />}
      </body>
    </html>
  );
}
