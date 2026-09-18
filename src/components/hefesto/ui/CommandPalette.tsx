"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  KeyRound,
  Network,
  ScrollText,
  Search,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { useDialogPanel } from "@/lib/hefesto/use-dialog-panel";
import { useAchievementsStore } from "@/lib/minerva/achievements-store";
import { useAudioPreferenceStore } from "@/lib/minerva/audio-preference-store";
import { useCommandPaletteStore } from "@/lib/minerva/command-palette-store";
import { cn } from "@/lib/utils";

/**
 * Forma mínima de Quest que necesita la búsqueda — no el `Quest` completo
 * de Deméter. `RootLayout` la arma con un `.map()` sobre `getQuestsForView()`
 * antes de pasarla por `SiteChrome` (ver el docblock en `layout.tsx`).
 */
export interface CommandPaletteQuest {
  id: string;
  title: string;
  summary: string;
}

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  keywords: string;
  onSelect: () => void;
}

/** Quita diacríticos + normaliza a minúsculas — "í"/"ó" no deberían importar al buscar. */
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * CommandPalette — Minerva & Hefesto, Iteración 29 ("El Toque del
 * Maestro"). Paleta de comandos `Cmd/Ctrl+K` construida a mano con
 * Framer Motion (sin `cmdk`: el proyecto no depende de ninguna librería
 * de menús externa — `EntityActionsMenu.tsx` tomó la misma decisión — y
 * esta paleta reutiliza mecánica que ya existe: `useDialogPanel` para el
 * focus trap/Escape/scroll-lock, y el mismo patrón store + trigger que
 * `achievements-store.ts` / `AchievementsDrawerTrigger`).
 *
 * Se monta una sola vez en `SiteChrome` (rutas públicas únicamente, igual
 * que `AchievementsDrawer`/`KonamiSecret` — nunca en `/admin/*`) y
 * mantiene el listener global de `Cmd/Ctrl+K` montado incluso con el
 * panel cerrado: es la única forma de abrirlo con el atajo desde
 * cualquier parte del sitio.
 *
 * Este componente exterior SÓLO decide cuándo el panel existe. Todo el
 * estado de la búsqueda (`query`/`activeIndex`) vive en
 * `CommandPaletteContent`, montado exclusivamente mientras `open` es
 * `true` — así arranca "en blanco" en cada apertura por construcción
 * (nunca hay que resetearlo a mano desde un efecto: HADES, evita el
 * anti-patrón de `setState` síncrono dentro de un efecto que dispara
 * la regla `react-hooks/set-state-in-effect`).
 */
export function CommandPalette({ quests }: CommandPaletteProps) {
  const open = useCommandPaletteStore((state) => state.open);
  const closePalette = useCommandPaletteStore((state) => state.closePalette);
  const togglePalette = useCommandPaletteStore((state) => state.togglePalette);

  // Atajo global Cmd/Ctrl+K — montado siempre (panel abierto o no), único
  // punto de entrada por teclado desde cualquier lugar del sitio público.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        togglePalette();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [togglePalette]);

  return (
    <AnimatePresence>
      {open && <CommandPaletteContent key="command-palette" quests={quests} onClose={closePalette} />}
    </AnimatePresence>
  );
}

interface CommandPaletteProps {
  quests: CommandPaletteQuest[];
}

interface CommandPaletteContentProps {
  quests: CommandPaletteQuest[];
  onClose: () => void;
}

/**
 * Acciones/Quests: buscar, saltar al Skill Tree, activar/desactivar el
 * audio del sitio (`audio-preference-store.ts`, Iteración 29 — cierra el
 * pendiente que `use-audio.ts` documentaba desde la Iteración 8), ver
 * logros desbloqueados, y un atajo secreto: escribir `/admin` revela un
 * único resultado que va directo al CMS — intencionalmente invisible
 * hasta que se escribe, no es un link real en ningún menú público.
 *
 * Accesibilidad (HADES): `role="dialog"` + `aria-modal`, input con
 * `role="combobox"` / `aria-expanded` / `aria-controls` /
 * `aria-activedescendant` apuntando al resultado activo
 * (`role="listbox"` / `role="option"`), y navegación completa por
 * teclado (↑/↓ mueven la selección, Enter ejecuta, Escape cierra vía
 * `useDialogPanel`) — el mismo estándar de combobox accesible que ya
 * siguen `MobileMenu`/`ConfirmDialog`.
 */
function CommandPaletteContent({ quests, onClose }: CommandPaletteContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  const muted = useAudioPreferenceStore((state) => state.muted);
  const toggleMuted = useAudioPreferenceStore((state) => state.toggleMuted);
  const openAchievementsDrawer = useAchievementsStore((state) => state.openDrawer);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const panelId = useId();
  const listboxId = useId();
  // `true` fijo: este componente sólo existe montado mientras el panel
  // está abierto (ver `CommandPalette` arriba) — no hace falta un flag.
  const panelRef = useDialogPanel<HTMLDivElement>(true, onClose);

  function runAndClose(action: () => void) {
    action();
    onClose();
  }

  function goToSkillTree() {
    if (pathname === "/") {
      document.getElementById("skill-tree")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/#skill-tree");
    }
  }

  const normalizedQuery = normalize(query.trim());

  const staticItems: CommandItem[] = useMemo(
    () => [
      {
        id: "action-skill-tree",
        label: "Saltar al Skill Tree",
        hint: "Experiencia laboral",
        icon: <Network className="h-4 w-4" aria-hidden />,
        keywords: "skill tree experiencia progresion trabajo laboral",
        onSelect: () => runAndClose(goToSkillTree),
      },
      {
        id: "action-audio",
        label: muted ? "Activar audio" : "Silenciar audio",
        hint: "Efectos de sonido del sitio",
        icon: muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />,
        keywords: "audio sonido sfx silenciar activar mute",
        onSelect: () => runAndClose(toggleMuted),
      },
      {
        id: "action-achievements",
        label: "Ver logros",
        hint: "Progreso desbloqueado en el sitio",
        icon: <Trophy className="h-4 w-4" aria-hidden />,
        keywords: "logros achievements trofeos progreso",
        onSelect: () => runAndClose(openAchievementsDrawer),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `goToSkillTree`/`runAndClose` son closures inline recreadas cada render sobre `pathname`/`router`; memoizar por `muted`/`toggleMuted`/`openAchievementsDrawer` alcanza, no hace falta re-listarlas.
    [muted, toggleMuted, openAchievementsDrawer]
  );

  const questItems: CommandItem[] = useMemo(
    () =>
      quests.map((quest) => ({
        id: `quest-${quest.id}`,
        label: quest.title,
        hint: quest.summary,
        icon: <ScrollText className="h-4 w-4" aria-hidden />,
        keywords: `${quest.title} ${quest.summary}`,
        onSelect: () => runAndClose(() => router.push(`/quests/${quest.id}`)),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `router` es estable entre renders para efectos prácticos; sólo `quests` decide si la lista cambia.
    [quests]
  );

  const secretItem: CommandItem | null = normalizedQuery.startsWith("/admin")
    ? {
        id: "action-admin",
        label: "Ir al CMS (/admin)",
        hint: "Acceso al panel — pide iniciar sesión si no hay una activa",
        icon: <KeyRound className="h-4 w-4" aria-hidden />,
        keywords: "/admin",
        onSelect: () => runAndClose(() => router.push("/admin")),
      }
    : null;

  const filteredActions = normalizedQuery
    ? staticItems.filter((item) => normalize(item.keywords).includes(normalizedQuery))
    : staticItems;

  const filteredQuests = normalizedQuery
    ? questItems.filter((item) => normalize(item.keywords).includes(normalizedQuery))
    : questItems;

  const sections: Array<{ label: string; items: CommandItem[] }> = [
    ...(secretItem ? [{ label: "Acceso", items: [secretItem] }] : []),
    ...(filteredActions.length > 0 ? [{ label: "Acciones", items: filteredActions }] : []),
    ...(filteredQuests.length > 0 ? [{ label: "Quests", items: filteredQuests }] : []),
  ];

  const flatItems = sections.flatMap((section) => section.items);

  // El índice activo puede quedar fuera de rango cuando el filtro cambia
  // la cantidad de resultados (p.ej. de 5 a 2) — se recorta, nunca se deja
  // apuntando a un ítem que ya no existe.
  const clampedActiveIndex = flatItems.length === 0 ? -1 : Math.min(activeIndex, flatItems.length - 1);

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (flatItems.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % flatItems.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + flatItems.length) % flatItems.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      flatItems[clampedActiveIndex]?.onSelect();
    }
  }

  // Índice plano compartido entre secciones — se incrementa a mano dentro
  // del `.map()` anidado de abajo (determinístico por render, no es
  // estado): es lo que sincroniza `aria-activedescendant`/`↑`/`↓` con la
  // grilla de resultados agrupada visualmente en 3 secciones distintas.
  let renderedIndex = -1;

  return (
    <>
      <motion.div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm print:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      />
      <motion.div
        id={panelId}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        className="fixed left-1/2 top-[12vh] z-[96] w-[min(34rem,92vw)] -translate-x-1/2 overflow-hidden rounded-2xl border border-emerald-glow/25 bg-obsidian-soft/90 shadow-[0_40px_120px_-24px_rgba(52,211,153,0.35)] backdrop-blur-2xl print:hidden"
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-parchment-muted" aria-hidden />
          <input
            autoFocus
            role="combobox"
            aria-expanded={flatItems.length > 0}
            aria-controls={listboxId}
            aria-activedescendant={clampedActiveIndex >= 0 ? `${listboxId}-option-${clampedActiveIndex}` : undefined}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Buscar una Quest, saltar a una sección…"
            className="w-full bg-transparent text-sm text-parchment placeholder:text-parchment-muted/60 focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-white/15 px-1.5 py-0.5 text-[0.65rem] text-parchment-muted/70 sm:inline-block">
            Esc
          </kbd>
        </div>

        <div id={listboxId} role="listbox" aria-label="Resultados" className="max-h-[min(24rem,60vh)] overflow-y-auto p-2">
          {flatItems.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-parchment-muted">
              Sin resultados para &ldquo;{query}&rdquo;.
            </p>
          )}

          {sections.map((section) => (
            <div key={section.label} role="group" aria-label={section.label} className="mb-1 last:mb-0">
              <p className="px-3 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-parchment-muted/70">
                {section.label}
              </p>
              {section.items.map((item) => {
                renderedIndex += 1;
                const isActive = renderedIndex === clampedActiveIndex;
                return (
                  <button
                    key={item.id}
                    id={`${listboxId}-option-${renderedIndex}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(renderedIndex)}
                    onClick={item.onSelect}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-100",
                      isActive
                        ? "bg-emerald-glow/15 text-parchment"
                        : "text-parchment-muted hover:bg-carbon-elevated hover:text-parchment"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                        isActive ? "border-emerald-glow/40 text-emerald-glow" : "border-white/10 text-parchment-muted"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-parchment">{item.label}</span>
                      {item.hint && <span className="block truncate text-xs text-parchment-muted/80">{item.hint}</span>}
                    </span>
                    {isActive && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-parchment-muted/60" aria-hidden />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-white/10 px-4 py-2.5 text-[0.7rem] text-parchment-muted/70">
          <span className="inline-flex items-center gap-1">
            <ArrowUp className="h-3 w-3" aria-hidden />
            <ArrowDown className="h-3 w-3" aria-hidden />
            navegar
          </span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" aria-hidden />
            seleccionar
          </span>
        </div>
      </motion.div>
    </>
  );
}
