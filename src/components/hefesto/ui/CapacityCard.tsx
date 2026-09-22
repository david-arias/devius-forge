import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type UsageLevel = "ok" | "warn" | "critical";

interface CapacityCardProps {
  icon: LucideIcon;
  label: string;
  /** Valor ya formateado ("12.4 MB"). */
  value: string;
  /** Límite ya formateado ("500 MB"). */
  limitLabel: string;
  /** 0–100 (puede pasar de 100 si se excede el plan). */
  percent: number;
  level: UsageLevel;
  /** Filas de detalle (buckets, tablas más pesadas…). */
  details?: { label: string; value: string }[];
  footnote?: string;
}

const LEVEL_STYLES: Record<UsageLevel, { bar: string; text: string; pill: string; pillLabel: string }> = {
  ok: {
    bar: "bg-emerald-glow",
    text: "text-emerald-glow",
    pill: "border-emerald-glow/40 bg-emerald-glow/10 text-emerald-glow",
    pillLabel: "Holgado",
  },
  warn: {
    bar: "bg-gold-glow",
    text: "text-gold-glow",
    pill: "border-gold-glow/40 bg-gold-glow/10 text-gold-glow",
    pillLabel: "Atención",
  },
  critical: {
    bar: "bg-danger",
    text: "text-danger",
    pill: "border-danger/50 bg-danger/10 text-danger",
    pillLabel: "Casi lleno",
  },
};

const percentFmt = new Intl.NumberFormat("es", { maximumFractionDigits: 1 });

/**
 * CapacityCard — Hefesto, Iteración 41 ("Capacidad de la Forja"). Stat
 * card con medidor de uso para el dashboard de `/admin`. Server Component
 * puro (sin hooks ni `"use client"`): sólo pinta lo que `getSystemMetrics()`
 * (Deméter) ya calculó.
 *
 * Accesibilidad: la barra es un `role="meter"` con `aria-valuenow` y un
 * `aria-valuetext` legible ("12.4 MB de 500 MB, 2.5%"); el color NUNCA es
 * la única señal — el porcentaje y el estado ("Holgado"/"Atención"/"Casi
 * lleno") van también en texto.
 */
export function CapacityCard({
  icon: Icon,
  label,
  value,
  limitLabel,
  percent,
  level,
  details,
  footnote,
}: CapacityCardProps) {
  const styles = LEVEL_STYLES[level];
  // Un uso mínimo (0.02%) igual se ve como una rayita — si no, la barra
  // parece "rota" en una base recién creada.
  const barWidth = percent <= 0 ? 0 : Math.max(Math.min(percent, 100), 1.5);
  const percentLabel = `${percentFmt.format(percent)}%`;

  return (
    <section
      aria-label={label}
      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-carbon/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-obsidian text-gold-glow">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className={cn("rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide", styles.pill)}>
          {styles.pillLabel}
        </span>
      </div>

      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-parchment-muted">{label}</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-3xl tabular-nums text-parchment">{value}</span>
          <span className="text-sm text-parchment-muted">de {limitLabel}</span>
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div
          role="meter"
          aria-label={`Uso de ${label}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(percent, 100)}
          aria-valuetext={`${value} de ${limitLabel}, ${percentLabel}`}
          className="h-2 overflow-hidden rounded-full bg-white/5"
        >
          <div className={cn("h-full rounded-full transition-[width] duration-700", styles.bar)} style={{ width: `${barWidth}%` }} />
        </div>
        <p className="flex justify-between text-xs text-parchment-muted">
          <span className={cn("font-semibold tabular-nums", styles.text)}>{percentLabel} usado</span>
          <span>Plan Free</span>
        </p>
      </div>

      {details && details.length > 0 && (
        <dl className="flex flex-col gap-1 border-t border-white/10 pt-3 text-xs">
          {details.map((row) => (
            <div key={row.label} className="flex justify-between gap-3">
              <dt className="truncate text-parchment-muted">{row.label}</dt>
              <dd className="shrink-0 tabular-nums text-parchment">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {footnote && <p className="text-xs leading-relaxed text-parchment-muted/80">{footnote}</p>}
    </section>
  );
}
