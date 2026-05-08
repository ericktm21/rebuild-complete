import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboard } from "./DashboardContext";

export function TrendChart({ metric }: { metric: "horasParadas" | "fallas" }) {
  const { trend, rangeLabelMonth, setRange } = useDashboard();
  const setMonth = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    setRange({ from: new Date(y, m - 1, 1), to: new Date(y, m, 0) });
  };

  const { data, avg, max } = useMemo(() => {
    const d = trend.map((m) => ({ ...m, value: m[metric] }));
    const avg = d.reduce((s, x) => s + x.value, 0) / d.length;
    const max = Math.max(...d.map((x) => x.value));
    return { data: d, avg, max };
  }, [trend, metric]);

  const title = metric === "horasParadas" ? "Tendencia · Horas de Parada" : "Tendencia · Frecuencia de Fallas";
  const seriesLabel = metric === "horasParadas" ? "Horas Paradas" : "N° Fallas";
  const fmt = (v: number) => v.toLocaleString("es-PE", { maximumFractionDigits: 1 });
  const stroke = metric === "horasParadas" ? "hsl(var(--destructive))" : "hsl(var(--chart-1))";
  const id = `grad-${metric}`;

  const current = data.find((d) => d.month === rangeLabelMonth);

  return (
    <div className="rounded-lg border bg-card p-3.5 shadow-xs">
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-serif-display text-2xl tabular text-foreground">
              {current ? fmt(current.value) : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground">vs prom. {fmt(avg)} · máx. {fmt(max)}</span>
          </div>
        </div>
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 6, left: -12, bottom: 0 }} onClick={(s: any) => s?.activePayload?.[0] && setMonth(s.activePayload[0].payload.month)}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11, boxShadow: "var(--shadow-pop)" }}
              formatter={(v: number) => [fmt(v), seriesLabel]}
              cursor={{ stroke: "hsl(var(--border-strong))", strokeDasharray: "3 3" }}
            />
            <ReferenceLine y={avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Area type="monotone" dataKey="value" stroke={stroke} strokeWidth={1.75} fill={`url(#${id})`} dot={{ r: 2.5, fill: stroke, strokeWidth: 0 }} activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
