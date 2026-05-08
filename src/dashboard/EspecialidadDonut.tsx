import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useDashboard } from "./DashboardContext";
import { ESPECIALIDAD_COLORS, Especialidad } from "@/data/maintenance";
import { cn } from "@/lib/utils";

// Custom external label with leader line + value badge
const renderLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, payload, fill } = props;
  const RAD = Math.PI / 180;
  const sin = Math.sin(-midAngle * RAD);
  const cos = Math.cos(-midAngle * RAD);
  const sx = cx + (outerRadius + 2) * cos;
  const sy = cy + (outerRadius + 2) * sin;
  const mx = cx + (outerRadius + 10) * cos;
  const my = cy + (outerRadius + 10) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 14;
  const ey = my;
  const anchor = cos >= 0 ? "start" : "end";
  const tx = ex + (cos >= 0 ? 3 : -3);

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} strokeWidth={1} fill="none" opacity={0.7} />
      <circle cx={ex} cy={ey} r={1.6} fill={fill} />
      <text x={tx} y={ey - 2} textAnchor={anchor} fill="hsl(var(--foreground))" fontSize={10.64} fontWeight={600}>
        {payload.pct.toFixed(1)}%
      </text>
      <text x={tx} y={ey + 9} textAnchor={anchor} fill="hsl(var(--muted-foreground))" fontSize={9.52} fontWeight={500}>
        {payload.value.toFixed(0)} h
      </text>
    </g>
  );
};

export function EspecialidadDonut() {
  const { events, filters, toggleFilter } = useDashboard();

  const data = useMemo(() => {
    const map = new Map<Especialidad, number>();
    events.forEach((e) => map.set(e.especialidad, (map.get(e.especialidad) ?? 0) + e.horasParadas));
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0) || 1;
    return Array.from(map.entries())
      .map(([k, v]) => ({ name: k as Especialidad, value: Number(v.toFixed(2)), pct: (v / total) * 100 }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="chart-card animate-card-in flex h-full flex-col rounded-lg border border-border/70 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[12px] font-semibold uppercase tracking-wide text-foreground">
          Duración de parada por Especialidad Técnica
        </h4>
        <span className="font-mono-tight text-[10px] text-muted-foreground">{data.length} cat.</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_auto] items-center gap-4">
        <div className="relative h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 14, right: 48, bottom: 14, left: 48 }}>
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover) / 0.97)", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11, boxShadow: "0 8px 24px -6px hsl(222 24% 11% / 0.18), 0 2px 6px hsl(222 24% 11% / 0.08)", padding: "6px 10px" }}
                formatter={(v: number, _n, p: any) => [`${v.toFixed(1)} h · ${p.payload.pct.toFixed(1)}%`, p.payload.name]}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={78}
                paddingAngle={2.5}
                cornerRadius={4}
                stroke="hsl(var(--card))"
                strokeWidth={2}
                onClick={(d: any) => toggleFilter("especialidad", d.name)}
                cursor="pointer"
                animationDuration={700}
                animationEasing="ease-out"
                labelLine={false}
                label={renderLabel}
              >
                {data.map((d, i) => (
                  <Cell
                    key={i}
                    fill={ESPECIALIDAD_COLORS[d.name]}
                    fillOpacity={filters.especialidad.size > 0 && !filters.especialidad.has(d.name) ? 0.25 : 1}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif-display text-[26px] leading-none tabular text-foreground">{total.toFixed(0)}</span>
            <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Hrs total</span>
          </div>
        </div>
        <ul className="space-y-2 text-[12px] pr-1">
          {data.map((d) => {
            const sel = filters.especialidad.has(d.name);
            const dim = filters.especialidad.size > 0 && !sel;
            return (
              <li key={d.name}>
                <button
                  onClick={() => toggleFilter("especialidad", d.name)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded px-1 py-0.5 text-left transition-base hover:bg-accent/[0.05]",
                    sel && "bg-primary/[0.06]",
                    dim && "opacity-40",
                  )}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ESPECIALIDAD_COLORS[d.name] }} />
                  <span className="truncate text-[11.5px] font-semibold uppercase tracking-wide text-foreground">{d.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
