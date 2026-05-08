import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { EVENTS, FailureEvent, MONTHLY_TREND, SUB_ZONAS, SubZonaConfig } from "@/data/maintenance";

export interface DateRange {
  from: Date;
  to: Date;
}

// ── Filtros estilo Power BI: cada dimensión es un Set de selecciones ────────
// Set vacío = "Todos". Múltiples valores = OR dentro de la dimensión, AND entre dimensiones.
export type FilterKey = "zona" | "area" | "subZona" | "especialidad" | "equipo";

export interface FiltersState {
  range: DateRange;
  zona: Set<string>;
  area: Set<string>;
  subZona: Set<string>;
  especialidad: Set<string>;
  equipo: Set<string>;
  search: string;
}

interface DashboardContextValue {
  filters: FiltersState;
  /** Toggle individual de un valor en una dimensión (clic en chart o checkbox) */
  toggleFilter: (key: FilterKey, value: string) => void;
  /** Reemplaza la selección completa de una dimensión */
  setFilterValues: (key: FilterKey, values: string[]) => void;
  /** Limpia una sola dimensión */
  clearFilter: (key: FilterKey) => void;
  /** Limpia todas las dimensiones (no la fecha) */
  resetFilters: () => void;
  setRange: (r: DateRange) => void;
  setSearch: (q: string) => void;
  /** Eventos cruzando todos los filtros */
  events: FailureEvent[];
  /** Eventos sólo cruzando el rango (sin slicers) — base para opciones disponibles */
  allPeriodEvents: FailureEvent[];
  /** Sub-zonas visibles tras los filtros (no por search) */
  subZonas: SubZonaConfig[];
  trend: typeof MONTHLY_TREND;
  rangeLabelMonth: string;
  /** Total de selecciones activas (para badge) */
  activeFilterCount: number;
  /** Helper: para una dimensión, devuelve los valores disponibles según el resto de filtros (cross-filter) */
  availableValues: (key: FilterKey) => string[];
}

const DashboardCtx = createContext<DashboardContextValue | null>(null);

const makeDefault = (): FiltersState => ({
  range: { from: new Date(2025, 7, 1), to: new Date(2025, 7, 31) }, // Ago 2025
  zona: new Set(),
  area: new Set(),
  subZona: new Set(),
  especialidad: new Set(),
  equipo: new Set(),
  search: "",
});

const inRange = (iso: string, from: Date, to: Date) => {
  const t = new Date(iso + "T12:00:00").getTime();
  return (
    t >= new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime() &&
    t <= new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59).getTime()
  );
};

const EXCLUDED_SUBZONAS = new Set(["EQUIPOS_MÓVILES", "AUTOMATISMO_4"]);

/** Aplica un subconjunto de filtros (omite la dimensión `skip` si se pasa) */
function applyFilters(
  events: FailureEvent[],
  f: FiltersState,
  skip?: FilterKey,
): FailureEvent[] {
  const q = f.search.trim().toLowerCase();
  return events.filter((e) => {
    if (skip !== "zona" && f.zona.size && !f.zona.has(e.zona)) return false;
    if (skip !== "area" && f.area.size && !f.area.has(e.area)) return false;
    if (skip !== "subZona" && f.subZona.size && !f.subZona.has(e.subZona)) return false;
    if (skip !== "especialidad" && f.especialidad.size && !f.especialidad.has(e.especialidad)) return false;
    if (skip !== "equipo" && f.equipo.size && !f.equipo.has(e.equipo)) return false;
    if (q && !`${e.equipo} ${e.evento} ${e.ot}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FiltersState>(makeDefault);

  const toggleFilter = useCallback((key: FilterKey, value: string) => {
    setFilters((f) => {
      const next = new Set(f[key]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...f, [key]: next };
    });
  }, []);

  const setFilterValues = useCallback((key: FilterKey, values: string[]) => {
    setFilters((f) => ({ ...f, [key]: new Set(values) }));
  }, []);

  const clearFilter = useCallback((key: FilterKey) => {
    setFilters((f) => ({ ...f, [key]: new Set() }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters((f) => ({ ...makeDefault(), range: f.range }));
  }, []);

  const setRange = useCallback((r: DateRange) => setFilters((f) => ({ ...f, range: r })), []);
  const setSearch = useCallback((q: string) => setFilters((f) => ({ ...f, search: q })), []);

  const allPeriodEvents = useMemo(
    () =>
      EVENTS.filter(
        (e) =>
          inRange(e.fecha, filters.range.from, filters.range.to) &&
          !EXCLUDED_SUBZONAS.has(e.subZona),
      ),
    [filters.range],
  );

  const events = useMemo(() => applyFilters(allPeriodEvents, filters), [allPeriodEvents, filters]);

  const subZonas = useMemo(() => {
    const zonas = filters.zona;
    const areas = filters.area;
    const subs = filters.subZona;
    return SUB_ZONAS.filter((z) => {
      if (EXCLUDED_SUBZONAS.has(z.name)) return false;
      if (zonas.size && !zonas.has(z.zona)) return false;
      if (areas.size && !areas.has(z.area)) return false;
      if (subs.size && !subs.has(z.name)) return false;
      return true;
    });
  }, [filters.zona, filters.area, filters.subZona]);

  const rangeLabelMonth = useMemo(() => {
    const d = filters.range.to;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [filters.range]);

  const activeFilterCount = useMemo(
    () =>
      filters.zona.size +
      filters.area.size +
      filters.subZona.size +
      filters.especialidad.size +
      filters.equipo.size,
    [filters],
  );

  // Cross-filter: opciones disponibles para una dimensión = valores presentes
  // en los datos tras aplicar TODOS los demás filtros (excepto el de esta dim)
  const availableValues = useCallback(
    (key: FilterKey): string[] => {
      const base = applyFilters(allPeriodEvents, filters, key);
      const set = new Set<string>();
      base.forEach((e) => set.add(e[key]));
      return Array.from(set).sort();
    },
    [allPeriodEvents, filters],
  );

  const value: DashboardContextValue = {
    filters,
    toggleFilter,
    setFilterValues,
    clearFilter,
    resetFilters,
    setRange,
    setSearch,
    events,
    allPeriodEvents,
    subZonas,
    trend: MONTHLY_TREND,
    rangeLabelMonth,
    activeFilterCount,
    availableValues,
  };

  return <DashboardCtx.Provider value={value}>{children}</DashboardCtx.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardCtx);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
