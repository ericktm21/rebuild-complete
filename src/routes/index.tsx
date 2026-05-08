import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { DashboardProvider, useDashboard } from "@/dashboard/DashboardContext";
import { DateRangePicker } from "@/dashboard/DateRangePicker";
import { MetricGrid } from "@/dashboard/SubZonaBarChart";
import { EquipoRankingChart } from "@/dashboard/EquipoRankingChart";
import { EspecialidadDonut } from "@/dashboard/EspecialidadDonut";
import { EventsTable } from "@/dashboard/EventsTable";
import { PowerBICharts } from "@/dashboard/PowerBICharts";
import { FilterBar } from "@/dashboard/FilterBar";
import { computeKpis, computeHorasProgramadas, EVENTS } from "@/data/maintenance";
import logoNorlima from "@/assets/logo-norlima.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtPct = (n: number) =>
  `${n >= 0 ? "+" : ""}${n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

function ReportHeader() {
  return (
    <div className="relative">
      <div className="bg-gradient-gold shadow-[0_2px_0_hsl(var(--brand-brick))]">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-gradient-brick shadow-[0_2px_4px_hsl(var(--brand-brick-dark)/0.4)]">
              <span className="text-[14px] font-black text-white">L</span>
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="text-[15px] font-extrabold uppercase tracking-tight text-[hsl(var(--brand-brown))]">
                MANTENIMIENTO CORRECTIVO DE EMERGENCIA
              </h1>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--brand-brick-dark))]">
                KPI · Dashboard de producción
              </span>
            </div>
          </div>
          <img
            src={logoNorlima}
            alt="Inversiones Norlima"
            className="h-8 w-auto rounded-sm bg-white px-1.5 py-0.5 shadow-sm ring-1 ring-[hsl(var(--brand-brown))]/15"
          />
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-[hsl(var(--brand-brick-dark))] via-[hsl(var(--brand-brick))] to-[hsl(var(--brand-brick-light))]" />
    </div>
  );
}

interface KpiCellProps {
  label: string;
  value: string;
  delta?: number;
  goodWhen?: "up" | "down";
}
function KpiCell({ label, value, delta, goodWhen = "down" }: KpiCellProps) {
  const hasDelta = typeof delta === "number" && isFinite(delta);
  const isUp = (delta ?? 0) > 0;
  const isGood = hasDelta && (goodWhen === "up" ? isUp : !isUp);
  const color = !hasDelta ? "text-muted-foreground" : isGood ? "text-[hsl(142_56%_30%)]" : "text-[hsl(var(--brand-brick-dark))]";
  const bg = !hasDelta ? "bg-foreground/[0.04]" : isGood ? "bg-[hsl(142_56%_36%)]/[0.10]" : "bg-[hsl(var(--brand-brick))]/[0.10]";
  const arrow = !hasDelta ? "" : isUp ? "▲" : "▼";

  return (
    <div className="group relative flex flex-col items-center justify-center px-2 py-1 text-center transition-base animate-kpi-in hover:bg-[hsl(var(--brand-gold))]/[0.08]">
      <span className="pointer-events-none absolute left-0 top-1/2 h-7 w-px -translate-y-1/2 bg-[hsl(var(--brand-brown))]/[0.12]" />
      <div className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground/90">
        {label}
      </div>
      <div className="mt-0.5 text-[20px] font-semibold leading-none tabular-nums text-foreground">
        {value}
      </div>
      {hasDelta && (
        <div className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums ${color} ${bg}`}>
          <span className="text-[8px]">{arrow}</span>
          {fmtPct(delta!)}
        </div>
      )}
    </div>
  );
}

function KpiBand() {
  const { events, subZonas, filters } = useDashboard();
  const current = useMemo(
    () => computeKpis(events, computeHorasProgramadas(filters.range.from, filters.range.to, subZonas)),
    [events, subZonas, filters.range],
  );

  const prev = useMemo(() => {
    const { from, to } = filters.range;
    const dayMs = 86400000;
    const days = Math.round((to.getTime() - from.getTime()) / dayMs) + 1;
    const prevTo = new Date(from.getTime() - dayMs);
    const prevFrom = new Date(prevTo.getTime() - (days - 1) * dayMs);
    const startMs = new Date(prevFrom.getFullYear(), prevFrom.getMonth(), prevFrom.getDate()).getTime();
    const endMs = new Date(prevTo.getFullYear(), prevTo.getMonth(), prevTo.getDate(), 23, 59, 59).getTime();
    const prevEvents = EVENTS.filter((e) => {
      const t = new Date(e.fecha + "T12:00:00").getTime();
      return t >= startMs && t <= endMs;
    });
    if (prevEvents.length === 0) return null;
    return computeKpis(prevEvents, computeHorasProgramadas(prevFrom, prevTo, subZonas));
  }, [filters.range, subZonas]);

  const delta = (curr: number, p: number | undefined) => {
    if (p === undefined || p === 0) return undefined;
    return ((curr - p) / p) * 100;
  };

  return (
    <div className="border-b border-border-strong/40 bg-gradient-to-b from-white to-[hsl(var(--brand-cream))] shadow-[0_2px_8px_-4px_hsl(22_38%_14%/0.10)]">
      <div className="mx-auto grid max-w-[1480px] grid-cols-[180px_240px_repeat(5,minmax(0,1fr))] items-stretch px-0">
        <div className="flex flex-col justify-center px-3 py-1.5">
          <div className="text-[10.5px] italic leading-snug text-foreground/70">
            Porcentajes
            <br />
            comparan
            <br />
            con periódo anterior
          </div>
        </div>

        <div className="flex items-center justify-center px-2 py-1.5">
          <DateRangePicker />
        </div>

        <KpiCell label="Horas Paradas" value={fmt(current.horasParadas)} delta={delta(current.horasParadas, prev?.horasParadas)} goodWhen="down" />
        <KpiCell label="N° de Fallas" value={fmt(current.fallas, 2)} delta={delta(current.fallas, prev?.fallas)} goodWhen="down" />
        <KpiCell label="MTBF" value={fmt(current.mtbf)} delta={delta(current.mtbf, prev?.mtbf)} goodWhen="up" />
        <KpiCell label="MTTR" value={fmt(current.mttr)} delta={delta(current.mttr, prev?.mttr)} goodWhen="down" />
        <KpiCell label="DISPONIBILIDAD" value={`${fmt(current.disponibilidad)}%`} delta={delta(current.disponibilidad, prev?.disponibilidad)} goodWhen="up" />
      </div>
    </div>
  );
}

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--brand-cream))] to-[hsl(var(--brand-sand))]/40">
      <ReportHeader />
      <KpiBand />
      <FilterBar />

      <main className="mx-auto flex w-full max-w-[1480px] flex-col gap-1.5 px-2 pb-2 pt-1.5">
        <MetricGrid />

        <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-[1fr_1fr_1.4fr]">
          <div className="h-[320px]"><EquipoRankingChart /></div>
          <div className="h-[320px]"><EspecialidadDonut /></div>
          <div className="h-[320px]"><EventsTable /></div>
        </div>

        <PowerBICharts />
      </main>
    </div>
  );
}

function Index() {
  return (
    <DashboardProvider>
      <DashboardLayout />
    </DashboardProvider>
  );
}
