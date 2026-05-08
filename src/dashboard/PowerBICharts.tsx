import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboard } from "./DashboardContext";

const BAR_COLOR = "#BE3F1A";       // brand brick
const BAR_COLOR_DARK = "#8E2A0E";  // brand brick dark
const AVG_COLOR = "#6B7280";       // neutral gray — línea promedio sutil
const AVG_BADGE_BG = "#F3F4F6";    // badge background claro
const AVG_BADGE_TEXT = "#374151";  // badge texto oscuro

const MONTHS_ES_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const fmtNum = (n: number, d = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const truncate = (s: string, n = 10) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="chart-card animate-card-in group/card rounded-lg border border-border/70 bg-white p-3.5 shadow-xs transition-all hover:shadow-md">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-[12.5px] font-semibold tracking-tight text-foreground">{title}</h3>
        {subtitle && <span className="text-[10px] font-medium text-muted-foreground">{subtitle}</span>}
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "hsl(var(--popover) / 0.98)",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 500,
  boxShadow: "0 10px 28px -8px hsl(222 24% 11% / 0.22), 0 2px 6px hsl(222 24% 11% / 0.08)",
  padding: "7px 11px",
};

const tickStyle = { fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 500 } as const;

// Shared gradient defs (inlined as JSX where used — Recharts only recognizes direct children)
const barGradientDefs = (
  <defs>
    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={BAR_COLOR} stopOpacity={1} />
      <stop offset="100%" stopColor={BAR_COLOR_DARK} stopOpacity={0.92} />
    </linearGradient>
    <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#F4D80A" stopOpacity={1} />
      <stop offset="100%" stopColor={BAR_COLOR} stopOpacity={1} />
    </linearGradient>
    <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor={BAR_COLOR_DARK} floodOpacity="0.25" />
    </filter>
  </defs>
);

// ── 1. Horas Paradas por área (sub-zona) ───────────────────────────────────
function HorasPorArea() {
  const { events } = useDashboard();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const data = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => map.set(e.subZona, (map.get(e.subZona) ?? 0) + e.horasParadas));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  const avg = useMemo(
    () => (data.length ? data.reduce((s, x) => s + x.value, 0) / data.length : 0),
    [data],
  );

  return (
    <ChartCard title="Horas Paradas por área" subtitle={`${data.length} áreas · Prom. ${fmtNum(avg, 1)}`}>
      <BarChart data={data} margin={{ top: 22, right: 56, left: 0, bottom: 8 }} onMouseLeave={() => setHoverIdx(null)}>
        {barGradientDefs}
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 5" strokeOpacity={0.55} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ ...tickStyle, fontSize: 9 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          height={64}
          angle={-40}
          textAnchor="end"
          tickMargin={6}
          tickFormatter={(v: string) => truncate(v, 14)}
        />
        <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={34} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => [`${fmtNum(v)} h`, "Horas Paradas"]}
          cursor={{ fill: "hsl(var(--muted) / 0.5)", radius: 4 }}
        />
        <Legend
          verticalAlign="top"
          align="left"
          iconType="circle"
          iconSize={8}
          height={24}
          wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingBottom: 12, top: -4 }}
          payload={[
            { value: "Horas Paradas", type: "circle", color: BAR_COLOR, id: "v" },
            { value: "Horas Promedio", type: "circle", color: AVG_COLOR, id: "a" },
          ]}
        />
        <Bar
          dataKey="value"
          name="Horas Paradas"
          radius={[5, 5, 0, 0]}
          animationDuration={850}
          animationEasing="ease-out"
          onMouseEnter={(_, i) => setHoverIdx(i)}
          maxBarSize={42}
        >
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={hoverIdx === i ? "url(#barGradHover)" : "url(#barGrad)"}
              style={{ transition: "all 200ms ease", filter: hoverIdx === i ? "url(#barShadow)" : "none" }}
            />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            offset={8}
            style={{
              fill: "hsl(var(--foreground))",
              fontSize: 10,
              fontWeight: 600,
              paintOrder: "stroke",
              stroke: "#FFFFFF",
              strokeWidth: 3,
              strokeLinejoin: "round",
            }}
            formatter={(v: number) => fmtNum(v)}
          />
        </Bar>
        <ReferenceLine
          y={avg}
          stroke={AVG_COLOR}
          strokeWidth={1.25}
          strokeDasharray="5 3"
          strokeOpacity={0.9}
          ifOverflow="extendDomain"
          label={({ viewBox }: any) => {
            const { x, y, width } = viewBox;
            const text = fmtNum(avg, 1);
            const w = text.length * 5.6 + 10;
            const h = 15;
            const bx = x + width + 10;
            const by = y - h / 2;
            return (
              <g>
                <rect x={bx} y={by} width={w} height={h} rx={3.5} ry={3.5} fill={AVG_BADGE_BG} stroke={AVG_COLOR} strokeOpacity={0.35} strokeWidth={1} />
                <text x={bx + w / 2} y={by + h / 2 + 3} textAnchor="middle" fill={AVG_BADGE_TEXT} fontSize={9} fontWeight={600} style={{ letterSpacing: "0.02em" }}>
                  {text}
                </text>
              </g>
            );
          }}
        />
      </BarChart>
    </ChartCard>
  );
}

// ── 2 & 3. Tendencia mensual ──────────────────────────────────────────────
function TrendMonthly({
  metric,
  title,
  seriesLabel,
}: {
  metric: "horasParadas" | "fallas";
  title: string;
  seriesLabel: string;
}) {
  const { trend, filters } = useDashboard();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const data = useMemo(() => {
    const fromYM = `${filters.range.from.getFullYear()}-${String(filters.range.from.getMonth() + 1).padStart(2, "0")}`;
    const toYM = `${filters.range.to.getFullYear()}-${String(filters.range.to.getMonth() + 1).padStart(2, "0")}`;
    return trend
      .filter((m) => m.month >= fromYM && m.month <= toYM)
      .map((m) => {
        const [y, mo] = m.month.split("-").map(Number);
        return {
          month: m.month,
          label: `${MONTHS_ES_SHORT[mo - 1]} ${String(y).slice(2)}`,
          fullLabel: `${y} ${MONTHS_ES_SHORT[mo - 1]}`,
          value: m[metric],
        };
      });
  }, [trend, filters.range, metric]);

  const avg = useMemo(
    () => (data.length ? data.reduce((s, x) => s + x.value, 0) / data.length : 0),
    [data],
  );

  const avgLabel = metric === "horasParadas" ? "Horas Promedio" : "Promedio Frecuencia";

  return (
    <ChartCard title={title} subtitle={`Prom. ${fmtNum(avg, 1)}`}>
      <BarChart data={data} margin={{ top: 22, right: 56, left: 0, bottom: 8 }} onMouseLeave={() => setHoverIdx(null)}>
        {barGradientDefs}
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 5" strokeOpacity={0.55} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ ...tickStyle, fontSize: 9, fill: "hsl(var(--foreground))" }}
          axisLine={false}
          tickLine={false}
          interval={0}
          height={64}
          angle={-40}
          textAnchor="end"
          tickMargin={6}
        />
        <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={34} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => [fmtNum(v, metric === "horasParadas" ? 1 : 0), seriesLabel]}
          labelFormatter={(_, p: any) => p?.[0]?.payload?.fullLabel ?? ""}
          cursor={{ fill: "hsl(var(--muted) / 0.5)", radius: 4 }}
        />
        <Legend
          verticalAlign="top"
          align="left"
          iconType="circle"
          iconSize={8}
          height={24}
          wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingBottom: 12, top: -4 }}
          payload={[
            { value: seriesLabel, type: "circle", color: BAR_COLOR, id: "v" },
            { value: avgLabel, type: "circle", color: AVG_COLOR, id: "a" },
          ]}
        />
        <Bar
          dataKey="value"
          name={seriesLabel}
          radius={[5, 5, 0, 0]}
          animationDuration={850}
          animationEasing="ease-out"
          onMouseEnter={(_, i) => setHoverIdx(i)}
          maxBarSize={38}
        >
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={hoverIdx === i ? "url(#barGradHover)" : "url(#barGrad)"}
              style={{ transition: "all 200ms ease", filter: hoverIdx === i ? "url(#barShadow)" : "none" }}
            />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            formatter={(v: number) => fmtNum(v, metric === "horasParadas" ? 1 : 0)}
            offset={10}
            style={{
              fill: "hsl(var(--foreground))",
              fontSize: 10,
              fontWeight: 600,
              paintOrder: "stroke",
              stroke: "#FFFFFF",
              strokeWidth: 3,
              strokeLinejoin: "round",
            }}
          />
        </Bar>
        <ReferenceLine
          y={avg}
          stroke={AVG_COLOR}
          strokeWidth={1.25}
          strokeDasharray="5 3"
          strokeOpacity={0.9}
          ifOverflow="extendDomain"
          label={({ viewBox }: any) => {
            const { x, y, width } = viewBox;
            const text = fmtNum(avg, 1);
            const w = text.length * 5.6 + 10;
            const h = 15;
            const bx = x + width + 10;
            const by = y - h / 2;
            return (
              <g>
                <rect x={bx} y={by} width={w} height={h} rx={3.5} ry={3.5} fill={AVG_BADGE_BG} stroke={AVG_COLOR} strokeOpacity={0.35} strokeWidth={1} />
                <text x={bx + w / 2} y={by + h / 2 + 3} textAnchor="middle" fill={AVG_BADGE_TEXT} fontSize={9} fontWeight={600} style={{ letterSpacing: "0.02em" }}>
                  {text}
                </text>
              </g>
            );
          }}
        />
      </BarChart>
    </ChartCard>
  );
}

export function PowerBICharts() {
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
      <HorasPorArea />
      <TrendMonthly metric="horasParadas" title="Tendencia Mensual de Horas de Parada" seriesLabel="Horas Paradas" />
      <TrendMonthly metric="fallas" title="Tendencia Mensual de Frecuencia de Fallas" seriesLabel="N° de Fallas" />
    </div>
  );
}
