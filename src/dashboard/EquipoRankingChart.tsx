import { useMemo } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDashboard } from "./DashboardContext";

const fmt = (n: number) => n.toLocaleString("es-PE", { maximumFractionDigits: 1 });

export function EquipoRankingChart() {
  const { events, filters, toggleFilter } = useDashboard();

  const data = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => map.set(e.equipo, (map.get(e.equipo) ?? 0) + e.horasParadas));
    return Array.from(map.entries())
      .map(([equipo, horas]) => ({ equipo, horas }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 10);
  }, [events]);

  const max = Math.max(1, ...data.map((d) => d.horas));

  return (
    <div className="chart-card animate-card-in flex h-full flex-col rounded-md border bg-card p-2 shadow-xs">
      <div className="mb-1 flex items-center justify-between">
        <h4 className="text-[10.5px] font-semibold uppercase tracking-wide text-foreground">
          Duración de Parada por Equipo (Hrs)
        </h4>
        <span className="font-mono-tight text-[9.5px] text-muted-foreground">{data.length} eq.</span>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="equipoBarGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--brand-brick-light))" />
                <stop offset="100%" stopColor="hsl(var(--brand-brick))" />
              </linearGradient>
              <linearGradient id="equipoBarGradDim" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--brand-sand))" />
                <stop offset="100%" stopColor="hsl(var(--border-strong))" />
              </linearGradient>
            </defs>
            <XAxis type="number" hide domain={[0, max * 1.18]} />
            <YAxis
              type="category"
              dataKey="equipo"
              width={158}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => (v.length > 24 ? v.slice(0, 22) + "…" : v)}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--brand-gold) / 0.10)" }}
              contentStyle={{ background: "hsl(var(--popover) / 0.97)", border: "1px solid hsl(var(--border-strong))", borderRadius: 8, fontSize: 11, boxShadow: "0 8px 24px -6px hsl(22 38% 14% / 0.18), 0 2px 6px hsl(22 38% 14% / 0.08)", padding: "6px 10px" }}
              formatter={(v: number) => [`${fmt(v)} h`, "Horas Paradas"]}
            />
            <Bar
              dataKey="horas"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(d: any) => toggleFilter("equipo", d.equipo)}
              barSize={14}
              animationDuration={700}
              animationEasing="ease-out"
              label={{ position: "right", fill: "hsl(var(--foreground))", fontSize: 10, formatter: (v: number) => fmt(v) }}
            >
              {data.map((d, i) => {
                const dim = filters.equipo.size > 0 && !filters.equipo.has(d.equipo);
                return (
                  <Cell key={i} fill={dim ? "url(#equipoBarGradDim)" : "url(#equipoBarGrad)"} />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
