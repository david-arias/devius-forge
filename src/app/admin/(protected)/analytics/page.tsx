import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Database,
  Download,
  Gauge,
  Inbox,
  Radar,
  ScrollText,
  Send,
  ShieldCheck,
  Timer,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { EmptyState, Magnetic, TelemetryRadar } from "@/components/hefesto/ui";
import { ACHIEVEMENTS } from "@/lib/demeter/queries/achievements";
import { getMessages } from "@/lib/demeter/queries/messages";
import { getTelemetryStatsForView } from "@/lib/minerva/get-telemetry-stats";
import { getQuests } from "@/lib/demeter/queries/quests";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Telemetría", robots: { index: false } };

const VERCEL_DASHBOARD_URL = "https://vercel.com/dashboard";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Cuenta mensajes de los últimos 7 días (fuera del render: el linter de React Compiler pide pureza). */
function countSince(dates: string[], windowMs: number) {
  const since = Date.now() - windowMs;
  return dates.filter((iso) => new Date(iso).getTime() >= since).length;
}

/* ─── Piezas de UI ────────────────────────────────────────────────────── */

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-obsidian-soft/60 p-5 backdrop-blur-md",
        "before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-emerald-glow/40 before:to-transparent",
        className
      )}
    >
      {children}
    </div>
  );
}

function StatusPill({ tone, children }: { tone: "live" | "idle" | "remote"; children: React.ReactNode }) {
  const styles = {
    live: "border-emerald-glow/30 bg-emerald-glow/10 text-emerald-glow",
    idle: "border-white/15 bg-white/5 text-parchment-muted",
    remote: "border-gold-glow/30 bg-gold-glow/10 text-gold-glow",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em]", styles)}>
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current", tone === "live" && "animate-pulse")} />
      {children}
    </span>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone: "live" | "idle" | "remote";
  toneLabel: string;
}

function StatCard({ icon: Icon, label, value, hint, tone, toneLabel }: StatCardProps) {
  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-obsidian text-gold-glow">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <StatusPill tone={tone}>{toneLabel}</StatusPill>
      </div>
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-parchment-muted">{label}</p>
        <p className={cn("mt-1 font-display text-3xl tabular-nums", tone === "remote" ? "text-parchment/40" : "text-parchment")}>
          {value}
        </p>
      </div>
      <p className="text-xs leading-relaxed text-parchment-muted/80">{hint}</p>
    </Panel>
  );
}

const relative = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/** "hace 3 h", "ayer"… — calculado fuera del render (pureza del React Compiler). */
function timeAgo(iso: string | null): string {
  if (!iso) return "Sin registros todavía";
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (Math.abs(diffMin) < 60) return `Último: ${relative.format(diffMin, "minute")}`;
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return `Último: ${relative.format(diffH, "hour")}`;
  return `Último: ${relative.format(Math.round(diffH / 24), "day")}`;
}

const numberFmt = new Intl.NumberFormat("es");

interface EventCardProps {
  icon: LucideIcon;
  label: string;
  eventName: string;
  total: number;
  last7d: number;
  lastSeen: string;
  share: number;
}

/** Tarjeta de evento real (Iteración 25): total histórico, últimos 7 días y barra de proporción. */
function EventCard({ icon: Icon, label, eventName, total, last7d, lastSeen, share }: EventCardProps) {
  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-glow/25 bg-gold-glow/10 text-gold-glow">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <StatusPill tone="live">En vivo</StatusPill>
      </div>
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-parchment-muted">{label}</p>
        <p className="mt-1 font-display text-5xl tabular-nums text-parchment">{numberFmt.format(total)}</p>
        <p className="mt-1 text-xs text-parchment-muted">
          <span className={last7d > 0 ? "text-emerald-glow" : undefined}>+{numberFmt.format(last7d)}</span> en los últimos 7 días
        </p>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-white/5"
        role="img"
        aria-label={`${Math.round(share * 100)}% de todos los eventos registrados`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-glow to-gold-glow"
          style={{ width: `${Math.max(share * 100, total > 0 ? 3 : 0)}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 text-[0.7rem] text-parchment-muted/80">
        <code className="font-mono text-emerald-glow/80">{eventName}</code>
        <span>{lastSeen}</span>
      </div>
    </Panel>
  );
}

/* ─── Página ──────────────────────────────────────────────────────────── */

/**
 * `/admin/analytics` — Hefesto, Iteración 24 → datos reales en la 25.
 *
 *  - Eventos custom (CV, mensajes, logros): 100% reales, desde
 *    `public.telemetry_events` vía `getTelemetryStatsForView()` (Minerva →
 *    Deméter → RPC `get_telemetry_stats` / `get_achievement_stats`).
 *  - Visitas y Web Vitals: siguen en Vercel (plan gratuito); se muestran
 *    como "Señal remota" con "—" (sin números inventados) y el botón
 *    magnético abre el dashboard.
 *  - Pulso de la Forja: Quests publicadas y mensajes, en vivo desde Supabase.
 */
export default async function AdminAnalyticsPage() {
  const [quests, messages, telemetry] = await Promise.all([
    getQuests({ includeDrafts: true }),
    getMessages({ limit: 500 }).catch(() => null),
    getTelemetryStatsForView(),
  ]);

  const published = quests.filter((q) => q.isPublished).length;
  const messagesThisWeek = messages ? countSince(messages.map((m) => m.createdAt), WEEK_MS) : null;

  const env = process.env.VERCEL_ENV ?? (process.env.NODE_ENV === "production" ? "production (local)" : "development");
  const telemetryLive = process.env.NODE_ENV === "production";
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

  const stats = telemetry.stats;
  const totalEvents = stats?.totalEvents ?? 0;
  const eventCards: EventCardProps[] = stats
    ? [
        { icon: Download, label: "CVs descargados", eventName: "cv_downloaded", ...stats.byEvent.cv_downloaded },
        { icon: Send, label: "Mensajes enviados", eventName: "contact_message_sent", ...stats.byEvent.contact_message_sent },
        { icon: Trophy, label: "Logros descubiertos", eventName: "achievement_unlocked", ...stats.byEvent.achievement_unlocked },
      ].map(({ lastAt, ...card }) => ({
        ...card,
        lastSeen: timeAgo(lastAt),
        share: totalEvents > 0 ? card.total / totalEvents : 0,
      }))
    : [];

  const unlockCounts = new Map(stats?.achievements.map((a) => [a.id, a]) ?? []);
  const achievementRows = ACHIEVEMENTS.map((a) => ({
    id: a.id,
    title: a.title,
    total: unlockCounts.get(a.id)?.total ?? 0,
  })).sort((a, b) => b.total - a.total);
  const maxUnlocks = Math.max(1, ...achievementRows.map((a) => a.total));

  const remoteCards: StatCardProps[] = [
    { icon: Users, label: "Visitantes únicos", value: "—", hint: "Aventureros distintos que cruzaron el portal. Gratis en Vercel Web Analytics.", tone: "remote", toneLabel: "Señal remota" },
    { icon: Activity, label: "Páginas vistas", value: "—", hint: "Home, casos de estudio y rutas más visitadas.", tone: "remote", toneLabel: "Señal remota" },
    { icon: Gauge, label: "Real Experience Score", value: "—", hint: "Puntaje de Speed Insights a partir de LCP, INP y CLS de visitantes reales.", tone: "remote", toneLabel: "Señal remota" },
    { icon: Timer, label: "LCP (p75)", value: "—", hint: "Tiempo hasta pintar el Hero. Meta: < 2.5 s.", tone: "remote", toneLabel: "Señal remota" },
  ];

  const forgeCards: StatCardProps[] = [
    {
      icon: ScrollText,
      label: "Quests en el mapa",
      value: String(published),
      hint: `${quests.length - published} en borrador · sólo las publicadas llegan al sitemap.`,
      tone: "live",
      toneLabel: "En vivo",
    },
    {
      icon: Inbox,
      label: "Pergaminos (7 días)",
      value: messagesThisWeek === null ? "—" : String(messagesThisWeek),
      hint: messages === null ? "Buzón no disponible (¿falta 006_messages.sql?)." : `${messages.length} en total en el Buzón.`,
      tone: messages === null ? "idle" : "live",
      toneLabel: messages === null ? "Sin señal" : "En vivo",
    },
  ];

  const blips = [
    { angle: 40, distance: 0.55, label: "cv" },
    { angle: 150, distance: 0.8, label: "contact" },
    { angle: 250, distance: 0.4, label: "achievement" },
    { angle: 310, distance: 0.7, label: "pageview" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Cabecera / consola ─────────────────────────────── */}
      <Panel className="mb-6 overflow-hidden p-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(52,211,153,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.05)_1px,transparent_1px)] bg-[size:28px_28px]"
        />
        <div className="relative grid grid-cols-1 items-center gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-2 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-emerald-glow">
              <Radar className="h-4 w-4" aria-hidden />
              Centro de Telemetría
            </p>
            <h1 className="font-display text-3xl leading-tight text-parchment sm:text-4xl">
              El Observatorio del Forgemaster
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-parchment-muted">
              Cada CV descargado, cada pergamino enviado y cada logro descubierto queda grabado en la Forja. Las
              visitas y la velocidad se leen en el radar de Vercel.
            </p>

            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 font-mono text-xs">
              <div>
                <dt className="text-parchment-muted/70">ENTORNO</dt>
                <dd className="text-parchment">{env}</dd>
              </div>
              <div>
                <dt className="text-parchment-muted/70">EVENTOS</dt>
                <dd className="flex items-center gap-1 text-parchment">
                  <Database className="h-3.5 w-3.5 text-emerald-glow" aria-hidden />
                  {stats ? `${numberFmt.format(totalEvents)} en Supabase` : "sin señal"}
                </dd>
              </div>
              <div>
                <dt className="text-parchment-muted/70">CAPTURA</dt>
                <dd className={telemetryLive ? "text-emerald-glow" : "text-gold-glow"}>
                  {telemetryLive ? "Activa" : "Pausada en desarrollo"}
                </dd>
              </div>
              {commit && (
                <div>
                  <dt className="text-parchment-muted/70">COMMIT</dt>
                  <dd className="text-parchment">{commit}</dd>
                </div>
              )}
              <div>
                <dt className="text-parchment-muted/70">FILTRO</dt>
                <dd className="flex items-center gap-1 text-parchment">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-glow" aria-hidden />
                  /admin excluido
                </dd>
              </div>
            </dl>

            <div className="mt-8">
              <Magnetic strength={0.4} className="inline-block">
                <a
                  href={VERCEL_DASHBOARD_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative inline-flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-glow to-gold-glow px-7 py-4 font-semibold text-obsidian shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_20px_60px_-15px_rgba(52,211,153,0.6)] transition-[filter,box-shadow] duration-300 hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3),0_24px_80px_-10px_rgba(232,196,104,0.7)]"
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-white/40 opacity-0 blur-md transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100"
                  />
                  <Radar className="h-5 w-5" aria-hidden />
                  Abrir Radar de Vercel
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  <span className="sr-only">(se abre en una pestaña nueva)</span>
                </a>
              </Magnetic>
            </div>
          </div>

          <TelemetryRadar blips={blips} className="mx-auto h-56 w-56 sm:h-64 sm:w-64" />
        </div>
      </Panel>

      {/* ── Runas rastreadas: datos reales ───────────────────── */}
      <section aria-labelledby="events-heading" className="mb-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="events-heading" className="font-display text-lg text-parchment">
            Runas rastreadas
          </h2>
          <p className="text-xs text-parchment-muted">Telemetría propia · Supabase · actualizado en cada visita al panel</p>
        </div>
        {telemetry.error ? (
          <EmptyState
            icon={AlertTriangle}
            title="El observatorio no recibe señal"
            description={`${telemetry.error} ¿Ya corriste 008_telemetry.sql en Supabase?`}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {eventCards.map((card) => (
              <EventCard key={card.eventName} {...card} />
            ))}
          </div>
        )}
      </section>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Salón de logros ──────────────────────────────── */}
        <section aria-labelledby="achievements-heading" className="min-w-0 lg:col-span-3">
          <h2 id="achievements-heading" className="mb-3 font-display text-lg text-parchment">
            Salón de logros
          </h2>
          <Panel className="p-0">
            <ol className="divide-y divide-white/5">
              {achievementRows.map((a, index) => (
                <li key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="w-5 shrink-0 text-right font-mono text-xs text-parchment-muted">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm text-parchment">{a.title}</p>
                      <p className="shrink-0 font-display text-lg tabular-nums text-gold-glow">{numberFmt.format(a.total)}</p>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5" aria-hidden>
                      <div
                        className="h-full rounded-full bg-gold-glow/70"
                        style={{ width: `${(a.total / maxUnlocks) * 100}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <p className="border-t border-white/5 px-5 py-3 text-xs text-parchment-muted">
              Cada visitante cuenta una sola vez por logro (se guarda la primera vez que lo desbloquea en su navegador).
            </p>
          </Panel>
        </section>

        {/* ── Pulso de la Forja ─────────────────────────────── */}
        <section aria-labelledby="forge-heading" className="min-w-0 lg:col-span-2">
          <h2 id="forge-heading" className="mb-3 font-display text-lg text-parchment">
            Pulso de la Forja
          </h2>
          <div className="grid gap-4">
            {forgeCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </section>
      </div>

      {/* ── Señales remotas (Vercel, gratis) ─────────────────── */}
      <section aria-labelledby="remote-heading">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="remote-heading" className="font-display text-lg text-parchment">
            Señales del radar de Vercel
          </h2>
          <p className="text-xs text-parchment-muted">Visitas y Web Vitals · consultalas con “Abrir Radar de Vercel”</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {remoteCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </section>
    </div>
  );
}
