import { useMemo, useState } from "react";
import { Search, ArrowDown, ArrowUp } from "lucide-react";
import { useDashboard } from "./DashboardContext";
import { cn } from "@/lib/utils";

export function EventsTable() {
  const { events, filters, setSearch } = useDashboard();
  const [sortKey, setSortKey] = useState<"horasParadas" | "fecha">("horasParadas");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      let r = 0;
      if (sortKey === "fecha") r = a.fecha.localeCompare(b.fecha);
      else r = a.horasParadas - b.horasParadas;
      return dir === "asc" ? r : -r;
    });
    return sorted;
  }, [events, sortKey, dir]);

  const total = rows.reduce((s, r) => s + r.horasParadas, 0);

  const SortHeader = ({ k, label, align = "left" }: { k: "horasParadas" | "fecha"; label: string; align?: "left" | "right" }) => (
    <button
      onClick={() => {
        if (sortKey === k) setDir(dir === "asc" ? "desc" : "asc");
        else { setSortKey(k); setDir("desc"); }
      }}
      className={cn("inline-flex items-center gap-0.5 font-semibold uppercase tracking-wider hover:text-foreground", align === "right" && "ml-auto")}
    >
      {label}
      {sortKey === k && (dir === "asc" ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />)}
    </button>
  );

  return (
    <div className="chart-card animate-card-in flex h-full flex-col rounded-md border border-border-strong/60 bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-2 py-1">
        <div className="flex items-baseline gap-2">
          <h4 className="text-[10.5px] font-semibold uppercase tracking-wide text-foreground">
            Detalle de Eventos
          </h4>
          <span className="font-mono-tight text-[9.5px] text-muted-foreground">
            {rows.length} reg · {total.toFixed(1)}h
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
          <Search className="h-3 w-3 text-muted-foreground" />
          <input
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="w-40 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 z-10 border-b bg-card text-[10px] text-muted-foreground">
            <tr>
              <th className="px-3 py-1.5 text-left font-semibold uppercase tracking-wider">Equipo</th>
              <th className="px-3 py-1.5 text-left font-semibold uppercase tracking-wider">Evento</th>
              <th className="px-3 py-1.5 text-left"><SortHeader k="fecha" label="Fecha" /></th>
              <th className="px-3 py-1.5 text-left font-semibold uppercase tracking-wider">Esp.</th>
              <th className="px-3 py-1.5 text-right"><SortHeader k="horasParadas" label="Horas" align="right" /></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-12 text-center text-muted-foreground">
                  Sin eventos para los filtros aplicados.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id} className={cn("border-b border-border/60 transition-base hover:bg-[hsl(var(--brand-gold))]/15", i % 2 === 1 && "bg-[hsl(var(--brand-cream))]/70")}>
                <td className="max-w-[180px] truncate px-3 py-1.5 align-top font-medium text-foreground">{r.equipo}</td>
                <td className="max-w-[320px] px-3 py-1.5 align-top text-muted-foreground">
                  <div className="line-clamp-2">{r.evento}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 align-top font-mono-tight tabular text-muted-foreground">
                  {(() => {
                    const [y, m, d] = r.fecha.split("-");
                    return `${d}/${m}/${y.slice(2)}`;
                  })()}
                </td>
                <td className="px-3 py-1.5 align-top">
                  <span className="rounded-sm bg-[hsl(var(--brand-brick))]/10 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-[hsl(var(--brand-brick-dark))]">
                    {r.especialidad}
                  </span>
                </td>
                <td className={cn(
                  "px-3 py-1.5 text-right align-top font-mono-tight tabular font-semibold",
                  r.horasParadas >= 50 ? "text-[hsl(var(--brand-brick-dark))]" : r.horasParadas >= 10 ? "text-[hsl(var(--brand-clay))]" : "text-foreground",
                )}>
                  {r.horasParadas.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t bg-secondary/30 px-3 py-1.5 text-[10.5px]">
        <span className="font-semibold uppercase tracking-wider text-muted-foreground">Total</span>
        <span className="font-mono-tight tabular font-semibold text-foreground">{total.toFixed(2)} h</span>
      </div>
    </div>
  );
}
