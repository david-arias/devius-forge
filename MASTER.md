# MASTER.md — Sistema de Diseño (Devius Portafolio)

Fuente única de verdad visual del proyecto. Dominio de **Hefesto**. Todo componente en `src/components/hefesto/ui` debe derivar de estos tokens — no se introducen colores, tipografías ni radios "sueltos" fuera de aquí.

Tokens implementados en `src/app/globals.css` (Tailwind v4, `@theme inline`).

## Temática — Dark RPG (Premium & Accesible)

Asimetría controlada / bento grids. Sin saturación visual: pocos acentos, mucho contraste y jerarquía clara.

## Paleta

| Token | Uso | Valor |
|---|---|---|
| `obsidian` | Fondo base de la página | `#0a0a0f` |
| `obsidian-soft` | Fondo de secciones alternas | `#12121a` |
| `carbon` | Fondo de tarjetas (Inventory Items) | `#1a1a24` |
| `carbon-elevated` | Fondo de tarjetas en hover/modal | `#23232f` |
| `border-subtle` | Bordes de tarjetas y divisores | `#2e2e3d` |
| `parchment` | Texto principal | `#e9e6df` |
| `parchment-muted` | Texto secundario | `#a8a5b0` |
| `emerald-glow` | Acento mágico primario (CTAs, links, XP) | `#34d399` |
| `emerald-deep` | Fondos de estado / selección | `#0f6b4f` |
| `gold-glow` | Acento secundario (rareza, focus ring, hover premium) | `#e8c468` |
| `gold-deep` | Bordes dorados sutiles | `#8a6a1f` |
| `neon` | Acento terciario (badges de tecnología, links activos) | `#7dd3fc` |
| `danger` | Errores / validación | `#f87171` |

**Contraste:** todo par texto/fondo usado en componentes debe verificarse ≥ 4.5:1 (WCAG AA). `parchment` sobre `obsidian`/`carbon` cumple; nunca usar `parchment-muted` para texto de body largo, sólo metadatos cortos.

## Tipografía

- **Display** (`--font-display`, Cinzel — serif épica): `h1`–`h4`, títulos de Quest, nombres de sección (Character Sheet, Skill Tree, Inventory).
- **Sans** (`--font-sans`, Inter): todo el contenido de lectura — párrafos, descripciones, labels, navegación.
- Nunca mezclar Display en párrafos largos: rompe la legibilidad.

## Radios y espaciado

- Tarjetas (cartas de inventario / quests): `rounded-xl` (0.75rem).
- Botones: `rounded-md` (0.375rem).
- Modales: `rounded-2xl` (1rem).
- Grid base: bento grid con `gap-4`/`gap-6`, nunca menor a `gap-3`.

## Accesibilidad (CRITICAL — no negociable)

1. Focus ring visible en **todo** elemento interactivo: `outline: 2px solid var(--color-focus-ring)` con `outline-offset: 3px` (ya global en `globals.css` vía `:focus-visible`).
2. Navegación completa por teclado (Tab/Shift+Tab/Enter/Escape) en modales de Quest y menús.
3. `prefers-reduced-motion` respetado — animaciones de Framer Motion deben tener variante reducida.
4. Contraste mínimo 4.5:1 verificado en cada componente nuevo antes de mergear (responsabilidad de HADES en QA).

## Componentes base (Hefesto — `src/components/hefesto/ui`)

| Componente | Metáfora | Notas |
|---|---|---|
| `Button` | Acción de Quest | Variants: `primary` (emerald), `secondary` (outline gold), `ghost`. Siempre con focus ring. |
| `Card` | Item de Inventario / Quest | Fondo `carbon`, borde `border-subtle`, hover eleva a `carbon-elevated` + glow sutil. |
| `Modal` | Detalle de Quest | Fondo `obsidian-soft` con backdrop-blur, cierre con Escape, focus trap. **Pendiente.** |
| `Badge` | Tag de tecnología (Item) / Loot de Quest | Construido en Iteración 3. Píldora translúcida (`bg-obsidian/50`, `backdrop-blur-sm`); variante por defecto `common` = borde `white/10` neutro (tags de Quest); `rare`/`legendary` añaden glow de color (Inventario, según rareza real del ítem). |
| `SectionHeading` | Encabezado de sección (Character Sheet, Skill Tree...) | Usa `font-display`, incluye ícono/motivo RPG opcional. |

## Micro-interacciones (Framer Motion)

- Entrada de tarjetas: fade + translateY(8px), stagger 0.05s entre items.
- Hover de Card: scale 1.02 + glow de borde (`emerald-glow` o `gold-glow` según contexto), 150ms ease-out.
- Apertura de Modal: scale 0.96→1 + fade, 200ms.
- Skill Tree: líneas de conexión se dibujan con `pathLength` al entrar en viewport.

Todos los presets de motion reutilizables deben centralizarse en `src/lib/minerva` o un futuro `src/lib/hefesto/motion.ts` (a definir por Hefesto) para evitar duplicación.

---

## Actualización — Iteración 2: "Alto Impacto" (Pro-Max)

_2026-09-14 — Hefesto_

Se elevó el nivel visual del scaffold inicial (que se sentía plano/wireframe) aplicando profundidad, textura y micro-interacciones reales. Cambios:

### Atmósfera y profundidad
- **Fondo dinámico** (`.forge-atmosphere` en `globals.css`, pintado en `layout.tsx`): 4 gradientes radiales en las esquinas (ámbar/esmeralda, opacidad ~0.09–0.12) sobre `obsidian` sólido — simulan la luz de la forja sin saturar.
- **Grano/noise** (`.noise-overlay`): SVG de `feTurbulence` como `background-image`, opacidad 3.5%, `mix-blend-mode: overlay`. Da textura táctil sin coste de performance (es CSS puro, no imagen descargada).
- **`Card` ahora es glassmorphism real**: `bg-white/[0.02]` + `backdrop-blur-md` + `border-t-white/10` (borde superior iluminado) + sombra interior sutil. En hover: el borde se tiñe de `gold-deep`, aparece un glow externo dorado y una línea de brillo (`::before`-like span) recorre el borde superior.

### Tipografía de alto contraste
- `SectionHeading` y el `<h1>` de la home ahora usan gradiente de texto (`bg-clip-text text-transparent`, blanco → gris) + `text-shadow` tenue (dorado en headings de sección, esmeralda en el H1 principal) para dar profundidad sin sacrificar contraste (el color base sigue siendo `parchment` casi puro).

### Layout: Bento asimétrico real
- Grid pasó de 3 a **4 columnas** en desktop. Reparto: `CharacterSheet` (2 cols × 2 rows), `Inventory` (1 col × 2 rows, más alto que antes), `SkillTree` (1 col × 2 rows) — las tres llenan las primeras dos filas en un patrón de rompecabezas — y `QuestGrid` ocupa el ancho completo debajo como showcase.

### Micro-interacciones (Framer Motion)
- Nuevo `src/lib/hefesto/motion.ts`: presets centralizados `staggerContainer`, `fadeInUp`, `cardHover` (tal como pedía la sección de Micro-interacciones original de este documento).
- Nuevo componente `StaggerReveal` (`src/components/hefesto/ui`): dispara `fadeInUp` escalonado en sus hijos al entrar en viewport (`whileInView`, `once: true`). Se usa en el grid principal de la home y dentro de `Inventory`, `SkillTree` y `QuestGrid` para que cada sección coreografíe la entrada de sus propios ítems.
- `Card` ahora es un componente cliente (`motion.div`) con su propia variant `fadeInUp` (hereda el trigger del `StaggerReveal` ancestro) y `whileHover` con lift de 4px + glow.
- Respeta `prefers-reduced-motion` (regla global ya existente en `globals.css`, sin cambios).

### Accesibilidad — sin regresiones
- Contraste verificado: `parchment` sobre los nuevos fondos translúcidos (`white/[0.02]` sobre `obsidian`) sigue ≥ 4.5:1 — la opacidad del overlay es demasiado baja para afectar el contraste real del texto, que sigue pintándose sobre el `obsidian` de fondo.
- Focus ring global sin tocar — sigue siendo el único mecanismo de foco, ahora más visible por el mayor contraste de los bordes de Card en reposo.
- `StaggerReveal`/`Card` no introducen `aria-hidden` ni ocultan contenido — sólo animan opacidad/posición ya visibles al primer render en SSR (Next.js renderiza el HTML final; Framer Motion sólo anima el *paint*, no el DOM disponible para lectores de pantalla).

---

## Actualización — Iteración 3: Poblando la Forja (Data & Contenido)

_2026-09-14 — Minerva + Hefesto_

Se reemplazó todo el placeholder por contenido real de Devius y se separó dato/presentación siguiendo la regla de oro del proyecto (Hefesto nunca importa de Deméter directamente, siempre vía Minerva):

- **Deméter** — nuevo schema `Character` (`src/lib/demeter/schemas/character.ts`) para la bio; `InventoryItem.category` ganó el valor `"animation"`; `SkillNode` ganó `achievements?: string[]` (la "XP obtenida" de cada rol). Contenido real cargado en `src/lib/demeter/queries/{character,inventory,skill-tree,quests}.ts`.
- **Minerva** — nuevo `getCharacterForView()`, mismo patrón que los demás getters.
- **Hefesto** — `CharacterSheet` dejó de tener texto hardcodeado y ahora recibe `character` por props, igual que el resto de secciones. `Inventory` agrupa los ítems por categoría en tres bloques temáticos (**Armas Principales**, **Artefactos de Diseño**, **Magia / Animación** — el mapeo categoría→etiqueta vive en el propio componente, es presentación, no dato). `SkillTree` renderiza los `achievements` como lista de "+XP" bajo cada nodo. `QuestGrid` separa visualmente rol (eyebrow dorado) / título (`text-parchment` pleno) / descripción (`text-parchment-muted`) y muestra el stack como "Loot".
- **Badge** construido (ver tabla de componentes arriba) y reutilizado en Inventario y Quests — unifica el estilo de píldora en todo el proyecto en vez de clases sueltas repetidas.
- **Espaciado:** `Card` pasó de `p-5` a `p-6 sm:p-7`; gaps del bento grid y del grid de Quests subieron de `gap-4` a `gap-5`/`gap-6` para que el contenido real respire.

`npm run build` y `npm run lint` verificados sin errores tras el cambio.

---

## Actualización — Iteración 4: Rediseño Radical (Alto Impacto Visual y Motion)

_2026-09-14 — Minerva + Hefesto_

- **Deméter** — `Quest` ganó `accentColor` (hex) y `imagePlaceholder: { from, to }` (gradiente de 2 stops). Resúmenes recortados a un solo párrafo de impacto.
- **Card (global)** — glassmorphism más fuerte: `bg-white/[0.03]`, `backdrop-blur-xl` (antes `-md`), reflejo superior más marcado (`shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]`, `0.12` en hover).
- **QuestGrid** — cada carta ahora tiene un mockup visual (gradiente por proyecto vía `imagePlaceholder`, con chrome de ventana falso y líneas de contenido simuladas — deja claro que es un placeholder, no una foto real) que hace `scale-105` en hover. El glow de borde/sombra en hover usa `color-mix(in srgb, var(--accent) X%, transparent)` sobre una variable CSS `--accent` inyectada por carta — así cada Quest brilla con su propio color sin que `Card` conozca datos. Jerarquía: rol (eyebrow, color = `--accent`), título (`text-parchment` pleno), descripción (`text-parchment/60 leading-relaxed`).
- **SkillTree** — la línea de tiempo se reescribió como layout flex (columna "rail" con el punto + `border-l border-white/10` que se estira por `flex-1`) en vez de offsets absolutos con números mágicos. Queda perfectamente alineada sin importar la altura de cada Card.
- **CharacterSheet** — párrafos secundarios pasaron a `text-parchment/60 leading-relaxed` para bajar la densidad visual del bloque de texto más largo del grid.

`npm run build` y `npm run lint` verificados sin errores; renderizado verificado sirviendo el build de producción localmente.

---

## Actualización — Iteración 5: Inyección de Vida (Motion Avanzado, Luces y Texturas)

_2026-09-14 — Hefesto_

`Card` ganó un `accentColor?: string` (hex, default dorado de marca) y ahora resuelve tres capas de profundidad por sí sola — nadie más necesita reimplementar esto:

1. **Borde en gradiente** — pseudo-capa (`div` `absolute inset-0`, `padding: 1px`, `mask-composite: exclude`) que simula luz incidiendo desde arriba. Siempre visible, no depende de hover.
2. **Spotlight que sigue el cursor** — `useMotionValue` + `useMotionTemplate` de Framer Motion recalculan un `radial-gradient` en cada `onPointerMove` sin pasar por el ciclo de render de React (los `MotionValue` empujan directo al DOM). Sólo visible en hover (`opacity-0` → `group-hover:opacity-100`), tintado con `color-mix(in srgb, var(--accent) 18%, transparent)`.
3. **Tilt/elevación** — `whileHover` con `y: -6, scale: 1.01` (preset `cardHover` en `src/lib/hefesto/motion.ts`) + sombra de elevación que también se tiñe del `accentColor` vía `color-mix()` en el `box-shadow` de hover.

`accentColor` se inyecta como variable CSS `--accent` en el propio elemento — cualquier hijo puede leerla con `style={{ color: "var(--accent)" }}` sin que ese componente hijo necesite conocer el valor (así lo consume el eyebrow de rol en `QuestGrid`). Las Quests pasan su `accentColor` real; el Skill Tree usa esmeralda (`#34d399`); Character Sheet e Inventario se quedan con el dorado por defecto.

La capa de grano (`.noise-overlay`, opacidad 0.035) y el fondo de atmósfera (`.forge-atmosphere`) ya existían desde la Iteración 2 y siguen intactos — cumplen el pedido de esta iteración sin cambios.

`npm run build` y `npm run lint` verificados sin errores; renderizado verificado sirviendo el build de producción localmente (el spotlight aparece en el HTML servido).

---

## Actualización — Iteración 6: Reestructuración Pro-Max (Flujo Narrativo y Profundidad)

_2026-09-14 — Apolo + Hefesto_

Pivote de arquitectura: de una sola vista comprimida (bento grid de 4 columnas) a una landing page de flujo vertical que cuenta una historia. Nuevo orden de secciones en `src/app/page.tsx`:

1. **Hero** (`src/components/hefesto/sections/Hero.tsx`, nuevo) — titular de impacto + placeholder de avatar/retrato con aro doble, "aura de la forja" (dos círculos `blur-3xl` en capas, esmeralda + dorado) y runas flotantes (íconos de `lucide-react` a opacidad 0.25-0.3 con `.animate-ember-float`, keyframe nuevo en `globals.css`, neutralizado por `prefers-reduced-motion`).
2. **Character Sheet** — la bio ahora vive en una carta ancha con `pb-16 sm:pb-20`; dos cartas de disciplina (UX/UI Design / Frontend Engineering) flotan superpuestas sobre su borde inferior (`-mt-10/-mt-12`, `z-10` — overlap real, no decorativo).
3. **Skill Tree** — pasó de columna angosta del bento a sección propia de ancho completo (`max-w-3xl` centrado), con más espacio entre nodos.
4. **Quests** (`QuestShowcase.tsx`, reemplaza a `QuestGrid.tsx`) — ya no es una grilla de cartas iguales: cada Quest es un showcase con la imagen ocupando 8 de 12 columnas y la carta de info flotando superpuesta sobre su esquina (columnas 7-11, `lg:items-end`), alternando de lado por índice. El overlap es CSS Grid puro (columnas compartidas entre imagen y carta), no matemática de píxeles.
5. **Inventario** — las píldoras de texto se reemplazaron por `LevelRing` (nuevo átomo, `src/components/hefesto/ui/LevelRing.tsx`): un anillo de progreso SVG animado (`strokeDashoffset` vía Framer Motion `whileInView`, una sola vez) con el nivel de dominio (0-100) en el centro. Requirió añadir `level: number` a `InventoryItemSchema` en Deméter — imprescindible para poder dibujar los anillos.

`npm run build` y `npm run lint` verificados sin errores; renderizado verificado sirviendo el build de producción (9 `LevelRing` con `stroke-dasharray`, cartas de disciplina y showcase de Quests presentes en el HTML servido).

---

## Actualización — Iteración 7: Funcionalidades Pro-Max (Navegación, CTAs y Animaciones On-Scroll)

_2026-09-14 — Minerva + Apolo + Hefesto_

- **Minerva (limpieza de datos):** `Character` ganó `tagline` (texto corto y épico, exclusivo del Hero) — `bio` (el arreglo completo de párrafos) quedó exclusivo del Character Sheet, se eliminó la duplicación de texto entre ambas secciones. Nuevo dominio de navegación: `Navigation` (`navLinks` + `socialLinks`) en Deméter, expuesto vía `getNavigationForView()` en Minerva — mismo patrón que el resto de getters.
- **Apolo (arquitectura):** dos componentes estructurales nuevos, `Navbar` y `Footer` (`src/components/hefesto/sections`), integrados en `src/app/layout.tsx` (envuelven `children`, no viven en `page.tsx` — son globales al sitio). `<html>` ganó `scroll-smooth`; cada sección anclable (`#quests`, `#skill-tree`, `#inventario`) tiene `scroll-mt-24` para que el Navbar fijo no tape el título al saltar por ancla.
- **Hefesto (motion y refinamiento):**
  - `Navbar`: `fixed top-0 z-50`, `bg-black/20 backdrop-blur-md`, borde inferior `border-white/10`. El CTA "Iniciar Quest" queda siempre visible (incluso en mobile); links de sección e íconos sociales se ocultan bajo `sm:`.
  - Nueva variante de `Button`, `cta`: gradiente `from-emerald-glow to-gold-glow`, glow doble (esmeralda + dorado) en hover. Se usa en Navbar, Hero y Footer — un solo componente, tres apariciones.
  - `LevelRing` (Inventario) ya animaba con `whileInView` desde la Iteración 6 — se confirma que arranca en 0 (`strokeDashoffset: CIRCUMFERENCE`) y se llena sólo al entrar en viewport.
  - Skill Tree: nuevo preset `slideIn` (`src/lib/hefesto/motion.ts`, fade + `x: -32 → 0`) pasado como `variants` explícito a cada `Card` del timeline — las props ganan por orden de spread, así que sobre-escribe el `fadeInUp` por defecto de `Card` sólo ahí.
  - Parallax del Hero: las runas (`Sparkles`/`Flame`/`Wand2`/`Gem`) pasaron de una animación CSS a `animate={{ y: [0, -10, 0] }}` de Framer Motion con `repeat: Infinity` y duración distinta por ícono (3.6s-5.4s, con delays). Importante: esto está guardado por `useReducedMotion()` — las animaciones infinitas vía `animate` de Framer Motion **no** las apaga la regla CSS global de `prefers-reduced-motion` (esa sólo cubre `@keyframes` nativos), así que había que desactivarlas explícitamente para no romper la regla de accesibilidad "CRITICAL" del proyecto.

`npm run build` y `npm run lint` verificados sin errores; renderizado verificado sirviendo el build de producción (Navbar/Footer, CTAs, anclas y tagline presentes en el HTML servido).

---

## Actualización — Iteración 8: El Toque Maestro (Gamificación, Modales y QA)

_2026-09-14 — Minerva + Hefesto + HADES_

- **Minerva (rutas de Quests):** `Quest` ganó `caseStudy: { problem, uxProcess, uiSolution, impact }` en Deméter, con contenido real para las 2 Quests. Se implementó la expansión de Quests con **rutas dinámicas de Next.js** (`src/app/quests/[slug]/page.tsx`, reutilizando `quest.id` como slug) en vez de modales `layoutId` de Framer Motion — decisión: un `layoutId` cross-page requiere que ambos elementos coexistan montados; en una navegación real de App Router el Hero se desmonta igual, así que la transición mágica se pierde de todas formas, mientras que las rutas reales dan URL compartible/indexable (el proyecto pide SEO fuerte), historial de navegador correcto y contenido pre-renderizado estáticamente vía `generateStaticParams()` — sin JS extra en el cliente. La página de detalle muestra los 4 "capítulos" del caso de estudio en `Card`s reutilizando el `accentColor` de cada Quest, con `generateMetadata()` dinámico y `notFound()` para slugs inexistentes. `QuestShowcase` ganó un link explícito "Ver caso de estudio" (`next/link`, con `aria-label` descriptivo por Quest) **separado** del botón externo opcional "Ver en vivo" — se evitó a propósito envolver toda la `Card` en un único `<a>` para no anidar enlaces (HTML inválido) ni generar ambigüedad de foco/anillo.
- **Hefesto (interactividad sensorial):**
  - `CustomCursor.tsx` (nuevo átomo) — punto luminoso con `mix-blend-mode: exclusion` que sigue el mouse (`useMotionValue` + `useSpring`, sin pasar por el ciclo de render de React) y se expande de 10px a 44px al pasar sobre cualquier elemento interactivo (detección por delegación de eventos a nivel `document`, no requiere marcar cada botón/link a mano). Se activa **sólo** tras confirmar `matchMedia("(pointer: fine)")` en el cliente — nunca oculta el cursor nativo de forma incondicional; dispositivos táctiles o sin puntero preciso conservan el cursor del sistema intacto. Montado una vez en `layout.tsx`.
  - `Magnetic.tsx` (nuevo átomo) — envuelve un CTA y lo hace seguir sutilmente el cursor dentro de su área (`strength` configurable, spring al soltar). Aplicado a los 3 CTAs "Iniciar Quest" (Navbar, Hero, Footer) — sólo a esos, para no saturar la página de movimiento.
  - **Partículas del Hero** — brasas/chispas flotando hacia arriba, implementadas con `@keyframes` **CSS puro** (`.animate-ember-rise` en `globals.css`), no Framer Motion ni canvas: al ser decorativas y repetitivas, CSS gana en rendimiento (compuesto fuera del hilo principal) y hereda gratis el apagado de `prefers-reduced-motion` (la regla global ya zeroea cualquier `@keyframes` de la página) — cero JS adicional para esa regla de accesibilidad, a diferencia de `Ember`/`Magnetic`/`CustomCursor`, que sí son `animate`/`useSpring` de Framer Motion y necesitan su propio guard de `useReducedMotion()`.
  - `useAudio` (`src/lib/hefesto/use-audio.ts`) — hook stub documentado, **no cableado** a ningún botón todavía (pedido como "opcional"): prevé un "whoosh" de hover y un "clink" metálico de click sobre los CTAs, con los requisitos de accesibilidad/UX que hay que resolver antes de activarlo (assets en `/public/sfx/`, nunca autoplay, control de silenciar persistido, independiente de `useReducedMotion()`).
- **HADES (auditoría WCAG — Definition of Done):**
  - Contraste corregido en dos puntos que fallaban el umbral 4.5:1 para texto pequeño (cálculo de luminancia relativa WCAG, con el alpha-blend hecho en espacio gamma/sRGB antes de linearizar, no en espacio lineal): la etiqueta "Loot" de `QuestShowcase` (`text-parchment-muted/70` sobre fondo de `Card` ≈ 4.37:1 → se subió a `/80` ≈ 5.36:1) y el copyright del `Footer` (`text-parchment-muted/60` sobre fondo obsidiano ≈ 3.54:1 → se subió a `/75` ≈ 4.97:1).
  - Todos los elementos interactivos nuevos llevan `aria-label` descriptivo cuando su texto visible no basta por sí solo ("Ver caso de estudio completo de {título}", "Ver {título} en vivo (se abre en una pestaña nueva)"); el cursor y las partículas llevan `aria-hidden` (son 100% decorativos) y `pointer-events-none` donde corresponde.
  - `CustomCursor` y `Magnetic` son wrappers puramente visuales/posicionales: no introducen `tabIndex`, no interceptan `Tab`/`Enter`/`Space`, y no tocan el `:focus-visible` global — la navegación por teclado completa (Navbar → Hero CTA → Character Sheet → Skill Tree → Quests, incluyendo los nuevos links de caso de estudio → Inventario → Footer → página de detalle → link "Volver a Quests") sigue dependiendo exclusivamente del anillo de foco dorado ya definido en `globals.css`.
  - Rendimiento: partículas vía CSS `@keyframes` (fuera del hilo principal, sin recrear nodos), cursor vía `MotionValue`/`useSpring` (sin re-render de React por movimiento) — mismo patrón ya validado en `Card.tsx` desde la Iteración 5.

`npm run lint` y `rm -rf .next && npm run build` verificados sin errores (incluye las 2 rutas estáticas nuevas `/quests/oraculum-dashboard-saas` y `/quests/bazar-encantado-ecommerce`, generadas vía `generateStaticParams`). Smoke test verificado sirviendo el build de producción: home (200), páginas de detalle (200), slug inexistente (404), CSS servido con `focus-visible`, `custom-cursor-active`, `mix-blend` y `ember-rise` presentes, aria-labels de los nuevos links de caso de estudio confirmados en el HTML.

---

## Actualización — Iteración 9: Auditoría Pro-Max (Fixes de Base)

_2026-09-15 — Apolo + Hefesto + Minerva + HADES_

Auditoría exhaustiva en vivo (ver `auditoria-portafolio-devius.md`) resuelta: nav móvil (`MobileMenu.tsx`, drawer con focus trap), fix real de hidratación de `CustomCursor` (reescrito con `useSyncExternalStore`), `break-words` de red de seguridad en el H1 del Hero, metadatos completos (OG/Twitter/canonical/JSON-LD `Person`+`ProfilePage`, imagen social generada con `next/og` en `src/app/opengraph-image.tsx`), CTA secundario "Descargar CV", y campos opcionales `media`/`testimonial` en `Quest` para evidencia real (con fallback automático al placeholder mientras no se suban assets). Contraste del sistema de color verificado programáticamente: el peor caso da 8.97:1, muy por encima del mínimo 4.5:1. Detalle completo en `handoff.md` → "Iteración 9".

---

## Actualización — Iteración 10: Preparación CMS, IA Discoverability y Gamificación

_2026-09-15 — Deméter + Apolo + Minerva + Hefesto_

- **Deméter (patrón de repositorio):** cada archivo de `src/lib/demeter/queries/*.ts` (excepto `achievements.ts`, ver más abajo) se partió en dos capas: `fetchXFromSource(): Promise<unknown>` (hoy un array/objeto estático — el único código que cambia al conectar un CMS real, con comentario `TODO: Integrar CMS aquí` y ejemplos concretos de Sanity/Supabase) y `getX(): Promise<X>` (la función pública, sin cambios de firma, que valida la fuente con `XSchema.parse(...)` antes de exponerla). Detalle completo en `src/lib/demeter/README.md` → "Patrón de repositorio". La regla de oro del proyecto ("si migra el contenido, sólo Deméter cambia") ahora tiene un mecanismo concreto, no sólo una intención documentada.
- **Apolo (`llms.txt`):** nuevo `public/llms.txt` — perfil plano y semántico para agentes de IA/reclutamiento (resumen profesional, stack, los dos casos de estudio con métricas reales, experiencia, contacto). Se sirve automáticamente en `/llms.txt` por convención de carpeta `public/`, sin ruta especial en Next.js.
- **Minerva (Sistema de Logros):** nuevo store `src/lib/minerva/achievements-store.ts` (Zustand + `persist` en `localStorage`, key `devius-achievements`). Guarda `unlockedIds` (persistido) y una `toastQueue` transitoria (NUNCA persistida — evita que un reload repita una notificación ya vista). `unlock(id)` es idempotente y descarta ids desconocidos.
- **Deméter (Achievement):** nuevo schema `AchievementSchema` (`id`, `title`, `description`, `icon`) y `src/lib/demeter/queries/achievements.ts` con las definiciones de los 2 logros. A diferencia del resto de `queries/`, **no** sigue el patrón de repositorio de arriba — son ids que el código referencia directamente en los triggers, no contenido editorial (razón documentada en el propio archivo).
- **Hefesto (Toast de Logro):** nuevo `AchievementToast.tsx`, montado una vez en `layout.tsx` (mismo patrón que `CustomCursor`). Notificación estilo videojuego — borde en gradiente esmeralda→dorado siempre visible, ícono con halo, entra deslizando desde abajo (fade simple si `prefers-reduced-motion`), auto-dismiss a los ~4.2s con botón "Cerrar" alcanzable por teclado, `role="status" aria-live="polite"` sin robar foco. Sonido opcional vía nuevo `playAchievement()` en `useAudio` — mismo patrón lazy-init/fail-silent que `playHover`/`playClick` (Iteración 8): sigue **pendiente** el asset real `/public/sfx/achievement-unlock.mp3` y el control de "silenciar sonidos" que `use-audio.ts` ya pedía desde entonces.
- **Triggers implementados:**
  1. *Explorador de la Forja* — `AchievementScrollTrigger` (sentinel `IntersectionObserver`, sin listener de `scroll`) montado dentro de `Footer`.
  2. *Llamado a la Aventura* — en los CTAs "Iniciar Quest"/"Descargar CV" de las 4 apariciones del sitio: `Hero` y `MobileMenu` (ya Client Components) llaman `unlock(...)` directo en su `onClick`; `Navbar` y `Footer` (Server Components) usan el nuevo `AchievementCtaLink` — un wrapper de `<a>` mínimo que es el único hijo con `"use client"` en cada uno, así ninguna de las dos secciones se convierte entera en Client Component sólo por esto.

Verificado: `npx tsc --noEmit`, `npx eslint src` y `rm -rf .next && npm run build` (Turbopack) sin errores tras todos los cambios.

---

## Actualización — Iteración 12: Preparación Supabase, Refinamiento UI y Expansión Visual de Quests

_2026-09-15 — Deméter + Eleuthia + Éter + Minerva + Hefesto_

- **Deméter/Eleuthia/Éter (fundación Supabase):** nueva dependencia `@supabase/supabase-js`. `src/lib/supabase/client.ts` — cliente de navegador con `anon key` (lazy singleton, no rompe el build mientras `.env.local` no exista), documentando por qué la `service_role key` nunca debe vivir en un archivo `NEXT_PUBLIC_*`. `src/lib/supabase/schema.ts` — DDL comentado de la tabla `quests` (con RLS: lectura pública, escritura sólo autenticado) y del bucket `quest-images` (mismas políticas), más `SupabaseQuestRowSchema` (Zod) y `mapSupabaseQuestRow`: el adaptador real, ya escrito y validado, que se enchufa en `fetchQuestsFromSource()` (`src/lib/demeter/queries/quests.ts`, patrón de repositorio de la Iteración 10) el día que el proyecto de Supabase exista de verdad. `.env.local.example` documenta las dos variables necesarias.
- **Deméter (schema):** `QuestMediaSchema` factorizado (antes vivía inline dentro de `media`); `caseStudy` ganó `chapterMedia` opcional (imagen/video por capítulo, mismo shape que `media`) — alimenta el nuevo layout de la página de Quest.
- **Minerva (fix de navegación):** nuevo `ScrollToHash.tsx` — el link "Volver a Quests" (`/#quests`) no hacía scroll de forma confiable porque Next.js App Router navega esa ruta como soft-navigation client-side, así que el scroll-to-anchor nativo del navegador (que depende de un load de página completo) nunca se disparaba. Se resuelve leyendo `window.location.hash` a mano en un efecto montado una vez en la Home y haciendo `scrollIntoView` (con fallback a `"auto"` si `prefers-reduced-motion`). No afecta la navegación por ancla dentro de la misma página (esa sigue siendo nativa + `scroll-smooth`).
- **Minerva (estado):** `useAchievementsStore` ganó `drawerOpen` + `openDrawer`/`closeDrawer`/`toggleDrawer`, sin persistir (arranca cerrado en cada visita).
- **Hefesto (refactor de accesibilidad):** el focus trap/Escape/scroll-lock de `MobileMenu` (Iteración 9) se extrajo a `src/lib/hefesto/use-dialog-panel.ts` (`useDialogPanel`) — ahora también restaura el foco al elemento que lo tenía antes de abrir (más robusto que depender de un `triggerRef` pasado a mano). `MobileMenu` se refactorizó para usarlo; el nuevo `AchievementsDrawer` lo reutiliza sin duplicar nada.
- **Hefesto (Drawer de Logros):** `AchievementsDrawer.tsx` — panel lateral derecho, lista los 2 logros con estado desbloqueado (glow esmeralda/dorado + `CheckCircle2`) o bloqueado (`Lock`, atenuado, pero con título/descripción visibles a propósito — a diferencia de un juego real, conviene que el visitante sepa cómo desbloquearlo). Se abre desde `AchievementsDrawerTrigger` (ícono `Trophy` con punto esmeralda si hay algo desbloqueado) en el Navbar (oculto en mobile, donde vive como link "Ver logros" dentro de `MobileMenu`).
- **Hefesto (respiración UI):** el CTA "Ver caso de estudio" de `QuestShowcase` estaba pegado al Loot — `mt-auto` no generaba el espacio esperado (no había "espacio libre" que un margen automático pudiera repartir en ese flex column). Se reemplazó por `mt-6` fijo.
- **Hefesto (iconografía consistente):** `lucide-react` ya era una dependencia desde la Iteración 1 — no hacía falta instalar nada nuevo, sólo usarlo con más consistencia. Navbar ganó íconos sutiles por ancla (`ScrollText`/`Network`/`Backpack`) y `Swords` en su CTA; el CTA de `Footer` también ganó `Swords`; los botones de `QuestShowcase` ganaron `ScrollText`/`ExternalLink`. Los capítulos de la página de Quest ya tenían íconos desde la Iteración 8 (`Map`/`Lightbulb`/`Sparkles`/`Trophy`) — sin cambios ahí.
- **Hefesto (revolución de la página de Quest):** los 4 capítulos pasaron de una columna de texto plano a un layout "zig-zag" (`ChapterMediaFrame` + `Card`, alternando de lado por índice, mismo criterio que el overlap de `QuestShowcase`). `ChapterMediaFrame` muestra `caseStudy.chapterMedia[capítulo]` si existe; si no, cae a un gradiente tintado con el `accentColor` de la Quest + ícono `Image` de lucide-react centrado — listo para recibir URLs reales de Supabase Storage sin tocar el layout. La cabecera de la página también empezó a usar `quest.media` (Iteración 9) cuando existe, con el mismo fallback.
- **Next.js config:** `next.config.ts` ganó `images.remotePatterns` para `*.supabase.co/storage/v1/object/public/quest-images/**` — sin esto, una URL real de Supabase Storage en `media`/`chapterMedia` habría fallado en silencio con `next/image`.

Verificado: `npx tsc --noEmit`, `npx eslint src`, `rm -rf .next && npm run build` (Turbopack) sin errores.

---

## Actualización — Iteración 13: Migración a Supabase SQL y Expansión de Gamificación

_2026-09-15 — Deméter + Minerva + Hefesto + Apolo_

- **Deméter (SQL real):** `src/lib/supabase/sql/001_init.sql` — script completo, idempotente y listo para pegar en el SQL Editor de Supabase: tabla `quests` (con trigger `set_updated_at`), RLS (lectura pública, escritura sólo autenticado, una policy separada por operación en vez de un `for all` genérico), bucket `quest-images` + políticas, y un bloque de `INSERT` de ejemplo comentado para migrar las 2 Quests actuales cuando se decida. `schema.ts` (Iteración 12) ya no duplica el DDL en un comentario — apunta a este archivo como única fuente de verdad.
- **Apolo (guía DevOps):** `src/lib/supabase/SETUP.md` — 3 pasos: pegar el SQL, sacar `Project URL`/`anon key` de Project Settings → API, completar `.env.local`.
- **Hefesto (refactor):** el mapa ícono→componente de los Logros, duplicado entre `AchievementToast` y `AchievementsDrawer` desde la Iteración 12, se extrajo a `src/lib/hefesto/achievement-icons.ts` — con 4 logros nuevos entrando esta misma iteración, mantener dos copias sincronizadas a mano ya no era sostenible.
- **Minerva/Deméter (4 logros nuevos):** `ACHIEVEMENTS` pasó de 2 a 6 entradas — `blacksmith-curiosity` ("Curiosidad de Herrero"), `ui-scholar` ("Erudito de la UI"), `weapon-inspection` ("Inspección de Armamento"), `contact-established` ("Contacto Establecido"). El store (`achievements-store.ts`) no necesitó cambios de forma — `unlock(id)` ya era genérico desde la Iteración 10.
- **Triggers nuevos:**
  - *Curiosidad de Herrero* — `AchievementsDrawer` se dispara a sí mismo al abrirse (`useEffect` sobre su propio `open`), sin importar desde dónde se abrió.
  - *Erudito de la UI* — nuevo `QuestDwellTracker.tsx`, sentinel montado en `/quests/[slug]` con un `setTimeout` de 15s que se limpia al desmontar (irse antes no cuenta). A propósito NO vive en `QuestShowcase` (la grilla del Home) — el logro premia leer un caso de estudio, no ver la home de pasada.
  - *Inspección de Armamento* — `onMouseEnter`/`onClick` en cada anillo de `Inventory.tsx`. Sin `onFocus`: el anillo no es interactivo por naturaleza, agregarle `tabIndex` sólo para esto sería una parada vacía en el orden de tabulación.
  - *Contacto Establecido* — nuevo `FooterContactActions.tsx` reemplaza el `.map` estático de enlaces sociales del Footer: agrega un botón funcional de "copiar correo" (`navigator.clipboard`, con fallback a `execCommand` y feedback visual `Copy`→`Check`) y dispara el logro también al hacer click en LinkedIn.

Verificado: `npx tsc --noEmit`, `npx eslint src`, `rm -rf .next && npm run build` (Turbopack) sin errores.

---

## Actualización — Iteración 14: La Forja Oculta (Panel Admin, Auth y Formularios)

_2026-09-15 — Deméter + Eleuthia + Éter + Minerva + Hefesto_

- **Deméter (SQL de las 3 entidades restantes):** `src/lib/supabase/sql/002_admin_tables.sql` — mismo patrón que `001_init.sql` (trigger `set_updated_at` reutilizado, RLS con una policy por operación): tabla `character_sheet` (singleton, `id = 'default'`), `skill_tree` (espejo de `SkillNodeSchema`) e `inventory` (espejo de `InventoryItemSchema`). Ninguna se conecta todavía a `fetchXFromSource()` — el patrón de repositorio (Iteración 10) sigue sirviendo los arrays estáticos hasta la Iteración 15+.
- **Eleuthia/Éter (Auth real):** nueva dependencia `@supabase/ssr` (reemplazo oficial mantenido del extinto `@supabase/auth-helpers-nextjs`). `src/lib/supabase/server.ts` — cliente de Supabase para Server Components/Route Handlers, con sesión leída/escrita vía cookies (`cookies()` de Next.js). `src/proxy.ts` — Next.js 16 renombró la convención `middleware.ts` a `proxy.ts` (se migró directo a la nueva, sin pasar por la vieja); refresca el token de sesión en cada request a `/admin/*` y redirige a `/admin/login` si no hay sesión (primera línea de defensa). `src/app/admin/(protected)/layout.tsx` repite la misma verificación server-side (segunda línea, "defense in depth") — vive en el route group `(protected)` a propósito, para que `src/app/admin/login/page.tsx` (ruta hermana, no anidada) nunca herede la protección y genere un loop de redirect. `src/app/admin/login/page.tsx` — form email/password (`supabase.auth.signInWithPassword`), Client Component, con labels reales, foco visible y región `role="alert" aria-live="assertive"` para el error.
- **Éter (Storage):** `src/components/eter/ImageUploader.tsx` — nuevo átomo (nueva carpeta de rol, antes sólo existía como dominio documentado en `src/lib/eleuthia/README.md`/`sistema_agentes.md`): sube al bucket `quest-images` ya existente (mismo `QUEST_IMAGES_BUCKET`/`getSupabaseClient()` de la Iteración 12) bajo `<folder>/<timestamp>-<nombre-sanitizado>`, muestra estado de carga (`Loader2` girando) y nunca lanza — cualquier error de red/Supabase se muestra inline (`role="alert"`) y deja el input listo para reintentar. `onUploadComplete(publicUrl)` es el único contrato con quien lo use.
- **Minerva (formularios tipados):** nuevas dependencias `react-hook-form` + `@hookform/resolvers`. `src/lib/minerva/forms/` — un schema de FORMULARIO (no de dominio) + componente `useForm`/`zodResolver` por entidad: `CharacterForm`, `SkillsForm`, `InventoryForm`, `QuestForm`. Los schemas de formulario difieren de los de Deméter donde hace falta (p.ej. `bio`/`achievements` como textarea multilínea en vez de `string[]`, `caseStudy` aplanado en `QuestForm`) — cada archivo `*-form-schema.ts` documenta el porqué y expone un `toXInput()` que arma de vuelta la forma de dominio. Nota técnica: los campos con `.default(...)` en el schema de dominio (`status`, `rarity`) NO se pueden reusar tal cual en un form de `zodResolver` — `.default()` vuelve opcional el tipo de ENTRADA de Zod, lo que rompe la inferencia del `Resolver` de react-hook-form; se redeclaran sin `.default()` en el schema de formulario (el `defaultValues` de `useForm` ya cubre lo mismo). Mismo criterio para `level` (Inventario): `z.number()` liso, no `z.coerce.number()` (que vuelve el input `unknown`) — la conversión a número la hace `valueAsNumber: true` en el `register()` del campo, no el schema. `onSubmit` de los 4 formularios sólo hace `console.log` con un `// TODO: persistir en Supabase (Iteración 15+)` — ninguno persiste todavía, a propósito.
- **Hefesto (shell del panel — "La Forja Oculta"):** `src/components/hefesto/ui/AdminSidebar.tsx` — sidebar fija en desktop (`sm:flex`), colapsa a barra superior + drawer en mobile (mismo `useDialogPanel` que `MobileMenu`/`AchievementsDrawer` — focus trap, Escape, scroll-lock). Cuatro anclas con íconos de `lucide-react` consistentes con el resto del sitio (`ScrollText`/`Network`/`Backpack`/`Swords`) + logout (`supabase.auth.signOut()` → `/admin/login`). `src/app/admin/(protected)/page.tsx` — dashboard de entrada, 4 cartas (`Card`) que llevan a cada formulario.
- **Hefesto (Quest — hero masivo):** la cabecera de `/quests/[slug]` pasó de `min-h-[22rem]` a `min-h-[70vh]`. Nuevo `QuestHero.tsx` (Client Component mínimo, mismo criterio que `AchievementCtaLink`/`QuestDwellTracker`: la página sigue siendo Server Component) — parallax sutil vía `useScroll`/`useTransform` de Framer Motion (translateY 0→18%, scale 1→1.08 mientras el hero sale de vista), sólo se monta cuando `quest.media` existe. `useReducedMotion()` desactiva el parallax por completo (no sólo lo reduce) cuando corresponde.
- **Hefesto (Quest — lightbox de capítulos):** `ChapterMediaFrame` se movió de una función local en `page.tsx` a su propio Client Component en `src/components/hefesto/ui/`, con zoom fullscreen al clickear una imagen real (no aplica a video ni al placeholder de gradiente). Reutiliza `useDialogPanel` (cero código de accesibilidad duplicado): `role="dialog" aria-modal="true"`, Escape cierra, foco atrapado y restaurado, click en el backdrop cierra. `useReducedMotion()` cambia la transición de "scale + fade" a sólo "fade".

Verificado: `npx tsc --noEmit`, `npx eslint src`, `rm -rf .next && npm run build` (Turbopack) sin errores. Se detectó y corrigió en el camino un warning de deprecación de Next.js 16 (`middleware.ts` → `src/proxy.ts`, migrado directo a la convención nueva).
