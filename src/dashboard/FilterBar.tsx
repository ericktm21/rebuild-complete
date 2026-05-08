import { useMemo, useState } from "react";
import { Check, ChevronDown, Filter, RotateCcw, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDashboard, FilterKey } from "./DashboardContext";
import { SUB_ZONAS } from "@/data/maintenance";
import { cn } from "@/lib/utils";

const ZONAS_ALL = Array.from(new Set(SUB_ZONAS.map((s) => s.zona))).sort();
const AREAS_ALL = Array.from(new Set(SUB_ZONAS.map((s) => s.area))).sort();
const SUBZONAS_ALL = SUB_ZONAS.map((s) => s.name).sort();
const ESPECIALIDADES_ALL = ["MECÁNICO", "ELÉCTRICO", "SOLDADOR", "MOLDERO", "AUTOMOTRIZ"];

export function FilterBar() {
  const { filters, activeFilterCount, resetFilters, availableValues, allPeriodEvents } =
    useDashboard();
  const [open, setOpen] = useState(false);

  const equiposAll = useMemo(
    () => Array.from(new Set(allPeriodEvents.map((e) => e.equipo))).sort(),
    [allPeriodEvents],
  );

  return (
    <div className="fixed right-3 top-2 z-40 print:hidden">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label="Filtros"
            className={cn(
              "group relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-[hsl(var(--brand-brown))]/20 bg-white/85 text-[hsl(var(--brand-brown))] shadow-sm backdrop-blur transition-base hover:bg-white hover:shadow-md",
              activeFilterCount > 0 && "border-primary/50 text-primary",
            )}
          >
            <Filter className="h-3.5 w-3.5" strokeWidth={2.25} />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground shadow">
                {activeFilterCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[min(92vw,520px)] animate-scale-in rounded-xl border-border-strong/40 p-0 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <div className="flex items-center gap-2 text-[hsl(var(--brand-brown))]">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Filtros</span>
              {activeFilterCount > 0 && (
                <span className="rounded-sm bg-primary px-1.5 py-px text-[10px] font-bold leading-snug text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-[10.5px] font-semibold text-destructive transition-base hover:bg-destructive/20"
              >
                <RotateCcw className="h-2.5 w-2.5" /> Limpiar
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 p-3">
            <Slicer label="Zona" dimension="zona" allOptions={ZONAS_ALL} available={availableValues("zona")} selected={filters.zona} />
            <Slicer label="Área" dimension="area" allOptions={AREAS_ALL} available={availableValues("area")} selected={filters.area} />
            <Slicer label="Sub-zona" dimension="subZona" allOptions={SUBZONAS_ALL} available={availableValues("subZona")} selected={filters.subZona} />
            <Slicer label="Especialidad" dimension="especialidad" allOptions={ESPECIALIDADES_ALL} available={availableValues("especialidad")} selected={filters.especialidad} />
            <Slicer label="Equipo" dimension="equipo" allOptions={equiposAll} available={availableValues("equipo")} selected={filters.equipo} searchable />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface SlicerProps {
  label: string;
  dimension: FilterKey;
  allOptions: string[];
  available: string[];
  selected: Set<string>;
  searchable?: boolean;
}

function Slicer({ label, dimension, allOptions, available, selected, searchable }: SlicerProps) {
  const { toggleFilter, setFilterValues, clearFilter } = useDashboard();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const availSet = useMemo(() => new Set(available), [available]);
  const visibleOptions = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return allOptions.filter((o) => !ql || o.toLowerCase().includes(ql));
  }, [allOptions, q]);

  const count = selected.size;
  const summary =
    count === 0
      ? "Todos"
      : count === 1
        ? Array.from(selected)[0]
        : `${count} seleccionados`;

  const selectAllVisible = () => {
    const next = visibleOptions.filter((o) => availSet.has(o));
    setFilterValues(dimension, next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] font-medium shadow-xs transition-base",
            count > 0
              ? "border-primary/40 bg-primary/[0.06] text-primary"
              : "text-foreground hover:border-border-strong hover:bg-accent/[0.04]",
          )}
        >
          <span className="text-muted-foreground">{label}</span>
          <span className="max-w-[120px] truncate">{summary}</span>
          {count > 0 && (
            <span className="rounded-sm bg-primary px-1 text-[9px] font-bold leading-snug text-primary-foreground">
              {count}
            </span>
          )}
          <ChevronDown className="h-2.5 w-2.5 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {count > 0 && (
            <button
              onClick={() => clearFilter(dimension)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive hover:underline"
            >
              <X className="h-3 w-3" /> Limpiar
            </button>
          )}
        </div>

        {searchable && (
          <div className="flex items-center gap-1.5 border-b px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
              className="w-full bg-transparent text-xs outline-none"
            />
          </div>
        )}

        <div className="flex items-center justify-between px-3 py-1.5 text-[11px]">
          <button
            onClick={selectAllVisible}
            className="font-semibold text-primary hover:underline"
          >
            Seleccionar todo
          </button>
          <span className="text-muted-foreground">
            {availSet.size}/{allOptions.length} disponibles
          </span>
        </div>

        <ul className="scroll-thin max-h-64 overflow-auto py-1">
          {visibleOptions.length === 0 && (
            <li className="px-3 py-4 text-center text-xs text-muted-foreground">Sin resultados</li>
          )}
          {visibleOptions.map((opt) => {
            const isSel = selected.has(opt);
            const isAvail = availSet.has(opt) || isSel;
            return (
              <li key={opt}>
                <button
                  onClick={() => toggleFilter(dimension, opt)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-base hover:bg-accent/40",
                    !isAvail && "opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      isSel
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background",
                    )}
                  >
                    {isSel && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
