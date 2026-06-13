"use client";

/**
 * Dependency-free, animated chart primitives for the admin console.
 * Hand-rolled SVG to avoid bundling a chart library into the static export.
 * All colours accept CSS custom-property strings (e.g. "var(--primary)").
 */

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useId, useState } from "react";

// ── Animated number ─────────────────────────────────────────────────────────────

export const AnimatedNumber = ({
  value,
  duration = 0.9,
  format = (n: number) => n.toLocaleString("en-IN"),
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}) => {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (latest) => Math.round(latest));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [value, duration, mv, rounded]);

  return <>{format(display)}</>;
};

// ── Donut chart ─────────────────────────────────────────────────────────────────

export type DonutSegment = { label: string; value: number; color: string };

export const DonutChart = ({
  segments,
  size = 132,
  thickness = 16,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerValue?: string | number;
  centerLabel?: string;
}) => {
  const radius = (size - thickness) / 2;
  const circumference = radius * 2 * Math.PI;
  const total = segments.reduce((acc, s) => acc + s.value, 0);

  let offsetAccum = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--border)" strokeWidth={thickness} opacity={0.5}
        />
        {total > 0 && segments.map((seg, i) => {
          const fraction = seg.value / total;
          const dash = fraction * circumference;
          const segOffset = offsetAccum;
          offsetAccum += dash;
          return (
            <motion.circle
              key={seg.label}
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={seg.color} strokeWidth={thickness} strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              initial={{ strokeDashoffset: -circumference }}
              animate={{ strokeDashoffset: -segOffset }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 + i * 0.08 }}
            />
          );
        })}
      </svg>
      {(centerValue !== undefined || centerLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue !== undefined && (
            <span className="text-2xl font-bold leading-none" style={{ color: "var(--foreground)" }}>{centerValue}</span>
          )}
          {centerLabel && (
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--medium-gray)" }}>{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

export const DonutLegend = ({ segments }: { segments: DonutSegment[] }) => (
  <div className="space-y-2">
    {segments.map((s) => (
      <div key={s.label} className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2" style={{ color: "var(--medium-gray)" }}>
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
          {s.label}
        </span>
        <span className="font-bold tabular-nums" style={{ color: "var(--foreground)" }}>{s.value.toLocaleString("en-IN")}</span>
      </div>
    ))}
  </div>
);

// ── Grouped vertical bars (timeseries) ──────────────────────────────────────────

export type BarSeries = { key: string; label: string; color: string };
export type BarGroup = { label: string; values: Record<string, number> };

export const GroupedBars = ({
  groups,
  series,
  height = 160,
  maxBars = 14,
}: {
  groups: BarGroup[];
  series: BarSeries[];
  height?: number;
  maxBars?: number;
}) => {
  const shown = groups.slice(-maxBars);
  const max = Math.max(
    1,
    ...shown.flatMap((g) => series.map((s) => g.values[s.key] ?? 0))
  );

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
        {shown.map((g, gi) => (
          <div key={g.label} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ minWidth: 0 }}>
            <div className="flex w-full items-end justify-center gap-[3px]" style={{ height: height - 18 }}>
              {series.map((s) => {
                const v = g.values[s.key] ?? 0;
                const h = (v / max) * (height - 18);
                return (
                  <motion.div
                    key={s.key}
                    className="group relative w-full max-w-[14px] rounded-t-md"
                    style={{ backgroundColor: s.color }}
                    initial={{ height: 0 }}
                    animate={{ height: Math.max(v > 0 ? 3 : 0, h) }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 * gi }}
                    title={`${s.label}: ${v}`}
                  >
                    <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[9px] font-bold opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ backgroundColor: "var(--foreground)", color: "var(--surface)" }}>
                      {v}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <span className="truncate text-[9px] font-medium" style={{ color: "var(--medium-gray)", maxWidth: 40 }}>{g.label}</span>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--medium-gray)" }}>
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Sparkline area ──────────────────────────────────────────────────────────────

export const Sparkline = ({
  data,
  color = "var(--primary)",
  height = 40,
  gradientId,
}: {
  data: number[];
  color?: string;
  height?: number;
  gradientId?: string;
}) => {
  const autoId = useId().replace(/[:]/g, "");
  if (!data.length) return null;
  const id = gradientId ?? `spark-${autoId}`;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * 100;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} 100,${height}`} fill={`url(#${id})`} />
      <motion.polyline
        points={points} fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </svg>
  );
};

// ── Horizontal funnel / progress bar ────────────────────────────────────────────

export const FunnelBar = ({
  rows,
}: {
  rows: { label: string; value: number; color: string }[];
}) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold" style={{ color: "var(--medium-gray)" }}>{r.label}</span>
            <span className="font-bold tabular-nums" style={{ color: "var(--foreground)" }}>{r.value.toLocaleString("en-IN")}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: r.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(r.value / max) * 100}%` }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.08 * i }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
