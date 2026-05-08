import { useMemo, useState } from "react";
import { useDashboard } from "./DashboardContext";
import { computeKpisBySubZona } from "@/data/maintenance";
import { cn } from "@/lib/utils";

const fmt = (n: number, d = 1) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

type Metric = "horasProgramadas" | "horasParadas" | "fallas" | "mtbf" | "mttr" | "disponibilidad";

interface Col {
  key: Metric;
  label: string;
  /** ancho relativo de la columna de barra+número */
  fr: number;
  /** ancho fijo (px) del número a la derecha de la barra */
  numW: number;
  /** color de la barra (Power BI palette) */
  color: string;
  format: (v: number, max: number) => string;
  /** % máximo de la barra (para disponibilidad usamos 100) */
  maxOverride?: number;
}

const COLS: Col[] = [
  { key: "horasProgramadas", label: "Horas de Operación Programadas", fr: 1.6, numW: 38, color: "#556B78", format: (v) => fmt(v, 0) },
  { key: "horasParadas",     label: "Horas Paradas",                  fr: 1.0, numW: 38, color: "#C0392B", format: (v) => fmt(v, 0) },
  { key: "fallas",           label: "N° Fallas",                      fr: 0.9, numW: 32, color: "#C65A2E", format: (v) => fmt(v, 0) },
  { key: "mtbf",             label: "MTBF",                           fr: 1.0, numW: 44, color: "#C65A2E", format: (v) => fmt(v, 1) },
  { key: "mttr",             label: "MTTR",                           fr: 1.0, numW: 36, color: "#C65A2E", format: (v) => fmt(v, 1) },
  { key: "disponibilidad",   label: "Disponibilidad",                 fr: 1.0, numW: 60, color: "#C65A2E", format: (v) => `${fmt(v, 2)} %`, maxOverride: 100 },
];

const GRID_COLS = `minmax(140px,180px) ${COLS.map((c) => `minmax(0, ${c.fr}fr)`).join(" ")}`;

/** Tabla matriz tipo Power BI con barras inline por columna */
export function MetricGrid() {
  const { events, subZonas, filters, toggleFilter } = useDashboard();
  const { range } = filters;
  const [sortKey, setSortKey] = useState<Metric>("horasParadas");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const all = computeKpisBySubZona(events, subZonas, range.from, range.to) as Array<
      { subZona: string } & Record<Metric, number>
    >;
    return [...all].sort((a, b) => {
      const r = a[sortKey] - b[sortKey];
      return dir === "asc" ? r : -r;
    });
  }, [events, subZonas, range.from, range.to, sortKey, dir]);

  const maxes = useMemo(() => {
    const m: Record<Metric, number> = {
      horasProgramadas: 0, horasParadas: 0, fallas: 0, mtbf: 0, mttr: 0, disponibilidad: 100,
    };
    rows.forEach((r) => {
      (Object.keys(m) as Metric[]).forEach((k) => {
        if (k === "disponibilidad") return;
        m[k] = Math.max(m[k], r[k] ?? 0);
      });
    });
    return m;
  }, [rows]);

  const onSort = (k: Metric) => {
    if (k === sortKey) setDir(dir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setDir("desc"); }
  };

  return (
    <div className="chart-card animate-card-in overflow-hidden rounded-md border border-border-strong/60 bg-white shadow-card">
      {/* Cabecera */}
      <div
        className="grid items-center gap-x-3 border-b-2 border-[hsl(var(--brand-brick))]/80 bg-gradient-to-b from-[hsl(var(--brand-cream))] to-[hsl(var(--brand-sand))] px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight text-[hsl(var(--brand-brown))]"
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        <button
          onClick={() => onSort("horasParadas")}
          className="text-left"
          aria-label="Sub Zona"
        >
          SUB ZONA
        </button>
        {COLS.map((c) => (
          <button
            key={c.key}
            onClick={() => onSort(c.key)}
            className={cn(
              "flex items-center gap-1 text-left",
              sortKey === c.key && "text-foreground",
            )}
          >
            <span className="truncate">{c.label}</span>
            {sortKey === c.key && (
              <span className="text-[9px]">{dir === "desc" ? "▼" : "▲"}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filas */}
      <div>
        {rows.map((r, i) => {
          const isSel = filters.subZona.has(r.subZona);
          const isDim = filters.subZona.size > 0 && !isSel;
          return (
            <button
              key={r.subZona}
              onClick={() => toggleFilter("subZona", r.subZona)}
              className={cn(
                "grid w-full items-center gap-x-3 border-b border-border/50 px-3 py-[2px] text-left text-[11px] transition-colors hover:bg-[hsl(var(--brand-gold))]/15",
                i % 2 === 1 && "bg-[hsl(var(--brand-cream))]/60",
                isSel && "bg-[hsl(var(--brand-gold))]/30",
                isDim && "opacity-40",
              )}
              style={{ gridTemplateColumns: GRID_COLS }}
            >
              <div className="truncate font-medium uppercase tracking-tight text-foreground">
                {r.subZona}
              </div>
              {COLS.map((c) => {
                const v = r[c.key];
                const max = c.maxOverride ?? maxes[c.key] ?? 1;
                const ratio = max > 0 ? Math.max(0, Math.min(1, v / max)) : 0;
                return (
                  <div key={c.key} className="flex items-center gap-2">
                    <div className="relative h-[10px] flex-1 overflow-hidden rounded-[2px] bg-foreground/[0.04]">
                      <div
                        className="absolute inset-y-0 left-0 rounded-[2px] transition-[width] duration-500 ease-out"
                        style={{ width: `${ratio * 100}%`, background: c.color, boxShadow: `inset 0 -1px 0 ${c.color}` }}
                      />
                    </div>
                    <span
                      className="shrink-0 text-right font-mono-tight tabular text-[10.5px] text-foreground"
                      style={{ width: c.numW }}
                    >
                      {c.format(v, max)}
                    </span>
                  </div>
                );
              })}
            </button>
          );
        })}
      </div>
    </div>
  );
}
