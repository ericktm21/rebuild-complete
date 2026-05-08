import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDashboard } from "./DashboardContext";

/* ────────────────────────────────────────────────────────────────
   Looker Studio style date range selector — adaptado al dashboard
   ──────────────────────────────────────────────────────────────── */

const MESES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGO = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

const fmtTrigger = (d: Date) => `${d.getDate()} ${MESES_CORTO[d.getMonth()]} ${d.getFullYear()}`;
const monthLabel = (y: number, m: number) => `${MESES_LARGO[m]} ${y}`;

const startOf = (d: Date) => { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; };
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const startOfWeek = (d: Date, sun: boolean) => {
  const r = startOf(d);
  const day = r.getDay();
  const offset = sun ? day : (day === 0 ? 6 : day - 1);
  r.setDate(r.getDate() - offset);
  return r;
};
const startOfQuarter = (d: Date) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
const endOfQuarter = (d: Date) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3 + 3, 0);

type ModeKey =
  | "fixed"
  | "today" | "yesterday"
  | "this-week-sun" | "this-week-sun-todate" | "this-week-mon" | "this-week-mon-todate"
  | "this-month" | "this-month-todate"
  | "this-quarter" | "this-quarter-todate"
  | "this-year" | "this-year-todate"
  | "last-7" | "last-14" | "last-28" | "last-30"
  | "last-week-sun" | "last-week-mon" | "last-month" | "last-quarter" | "last-year";

function rangeForMode(mode: ModeKey): { s: Date; e: Date; label: string } | null {
  const today = startOf(new Date());
  const yesterday = addDays(today, -1);
  switch (mode) {
    case "today": return { s: today, e: today, label: "Hoy" };
    case "yesterday": return { s: yesterday, e: yesterday, label: "Ayer" };
    case "this-week-sun": { const s = startOfWeek(today, true); return { s, e: addDays(s, 6), label: "Esta semana (dom)" }; }
    case "this-week-sun-todate": { const s = startOfWeek(today, true); return { s, e: today, label: "Esta semana hasta hoy (dom)" }; }
    case "this-week-mon": { const s = startOfWeek(today, false); return { s, e: addDays(s, 6), label: "Esta semana (lun)" }; }
    case "this-week-mon-todate": { const s = startOfWeek(today, false); return { s, e: today, label: "Esta semana hasta hoy (lun)" }; }
    case "this-month": return { s: startOfMonth(today), e: endOfMonth(today), label: "Este mes" };
    case "this-month-todate": return { s: startOfMonth(today), e: today, label: "Este mes hasta hoy" };
    case "this-quarter": return { s: startOfQuarter(today), e: endOfQuarter(today), label: "Este trimestre" };
    case "this-quarter-todate": return { s: startOfQuarter(today), e: today, label: "Este trimestre hasta hoy" };
    case "this-year": return { s: new Date(today.getFullYear(), 0, 1), e: new Date(today.getFullYear(), 11, 31), label: "Este año" };
    case "this-year-todate": return { s: new Date(today.getFullYear(), 0, 1), e: today, label: "Este año hasta hoy" };
    case "last-7": return { s: addDays(today, -6), e: today, label: "Los últimos 7 días" };
    case "last-14": return { s: addDays(today, -13), e: today, label: "Los últimos 14 días" };
    case "last-28": return { s: addDays(today, -27), e: today, label: "Los últimos 28 días" };
    case "last-30": return { s: addDays(today, -29), e: today, label: "Los últimos 30 días" };
    case "last-week-sun": { const s = startOfWeek(addDays(today, -7), true); return { s, e: addDays(s, 6), label: "Semana pasada (dom)" }; }
    case "last-week-mon": { const s = startOfWeek(addDays(today, -7), false); return { s, e: addDays(s, 6), label: "Semana pasada (lun)" }; }
    case "last-month": { const s = new Date(today.getFullYear(), today.getMonth() - 1, 1); return { s, e: endOfMonth(s), label: "El mes pasado" }; }
    case "last-quarter": { const pq = startOfQuarter(addDays(startOfQuarter(today), -1)); return { s: pq, e: endOfQuarter(pq), label: "El último trimestre" }; }
    case "last-year": return { s: new Date(today.getFullYear() - 1, 0, 1), e: new Date(today.getFullYear() - 1, 11, 31), label: "El año pasado" };
    default: return null;
  }
}

/* ── Mes calendario ─────────────────────────────────────────────── */
interface MonthGridProps {
  year: number;
  month: number;
  start: Date | null;
  end: Date | null;
  hover: Date | null;
  onPrev: () => void;
  onNext: () => void;
  onPick: (d: Date) => void;
  onHover: (d: Date | null) => void;
  title: string;
}
function MonthGrid({ year, month, start, end, hover, onPrev, onNext, onPick, onHover, title }: MonthGridProps) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const offset = (firstDay.getDay() + 6) % 7;
  const today = startOf(new Date());
  const rangeEnd = hover || end;

  const cells: Array<{ key: string; day?: number; date?: Date }> = [];
  for (let i = 0; i < offset; i++) cells.push({ key: `e${i}` });
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push({ key: `d${d}`, day: d, date: new Date(year, month, d) });

  return (
    <div className="flex-1">
      <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="mb-1.5 flex items-center justify-between">
        <button className="flex items-center gap-1 rounded px-1.5 py-1 text-[13px] font-medium hover:bg-muted">
          <span>{monthLabel(year, month)}</span>
        </button>
        <div className="flex gap-0.5">
          <button onClick={onPrev} className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={onNext} className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {DIAS.map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-medium uppercase text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((c) => {
          if (!c.date) return <div key={c.key} className="h-8" />;
          const isStart = sameDay(c.date, start);
          const isEnd = sameDay(c.date, rangeEnd);
          const inRange = !!(start && rangeEnd && c.date > start && c.date < rangeEnd);
          const isToday = sameDay(c.date, today);
          const single = isStart && isEnd;

          return (
            <div
              key={c.key}
              className={cn(
                "relative flex h-8 items-center justify-center",
                inRange && "bg-[#fff4b8]",
                isStart && !single && "bg-gradient-to-r from-transparent to-[#fff4b8]",
                isEnd && !single && !isStart && "bg-gradient-to-l from-transparent to-[#fff4b8]",
              )}
            >
              <button
                onClick={() => onPick(c.date!)}
                onMouseEnter={() => onHover(c.date!)}
                onMouseLeave={() => onHover(null)}
                className={cn(
                  "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[12px] tabular-nums transition-colors",
                  !isStart && !isEnd && "hover:bg-muted",
                  isToday && !isStart && !isEnd && "font-bold text-[#b8860b]",
                  (isStart || isEnd) && "bg-[#e8a900] font-semibold text-white hover:bg-[#d49800]",
                )}
              >
                {c.day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Mode dropdown (Fijo / presets) ─────────────────────────────── */
interface ModeItem {
  key: ModeKey;
  label: string;
  children?: ModeItem[];
}
const MODE_TREE: ModeItem[] = [
  { key: "fixed", label: "Fijo" },
  { key: "today", label: "Hoy" },
  { key: "yesterday", label: "Ayer" },
  {
    key: "this-month", label: "Este mes",
    children: [
      { key: "this-week-sun", label: "Esta semana (empieza en domingo)" },
      { key: "this-week-sun-todate", label: "Esta semana hasta la fecha (domingo)" },
      { key: "this-week-mon", label: "Esta semana (empieza en lunes)" },
      { key: "this-week-mon-todate", label: "Esta semana hasta la fecha (lunes)" },
      { key: "this-month", label: "Este mes" },
      { key: "this-month-todate", label: "Este mes hasta la fecha" },
      { key: "this-quarter", label: "Este trimestre" },
      { key: "this-quarter-todate", label: "Este trimestre hasta la fecha" },
      { key: "this-year", label: "Este año" },
      { key: "this-year-todate", label: "Este año hasta la fecha" },
    ],
  },
  {
    key: "last-7", label: "Los últimos 7 días",
    children: [
      { key: "last-7", label: "Los últimos 7 días" },
      { key: "last-14", label: "Los últimos 14 días" },
      { key: "last-28", label: "Los últimos 28 días" },
      { key: "last-30", label: "Los últimos 30 días" },
      { key: "last-week-sun", label: "La semana pasada (domingo)" },
      { key: "last-week-mon", label: "La semana pasada (lunes)" },
      { key: "last-month", label: "El mes pasado" },
      { key: "last-quarter", label: "El último trimestre" },
      { key: "last-year", label: "El año pasado" },
    ],
  },
];

function ModeDropdown({
  current,
  onPick,
}: {
  current: string;
  onPick: (key: ModeKey, label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={cn(
          "inline-flex min-w-[160px] items-center justify-between gap-2 rounded border bg-white px-2.5 py-1.5 text-[12.5px]",
          open ? "border-[#e8a900]" : "border-border hover:bg-muted",
        )}
      >
        <span>{current}</span>
        <ChevronDown className={cn("h-3 w-3 opacity-60 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 flex min-w-[230px] flex-col rounded bg-white py-1 shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
          {MODE_TREE.map((item) => (
            <div key={item.label} className="group relative">
              <button
                onClick={() => {
                  if (!item.children) {
                    onPick(item.key, item.label);
                    setOpen(false);
                  }
                }}
                className="flex w-full items-center justify-between px-3.5 py-2 text-left text-[12.5px] hover:bg-muted"
              >
                <span>{item.label}</span>
                {item.children && <span className="text-[9px] text-muted-foreground">▶</span>}
              </button>
              {item.children && (
                <div className="absolute left-full top-0 z-50 hidden min-w-[260px] flex-col rounded bg-white py-1 shadow-[0_2px_10px_rgba(0,0,0,0.2)] group-hover:flex">
                  {item.children.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => { onPick(c.key, c.label); setOpen(false); }}
                      className="px-3.5 py-2 text-left text-[12.5px] hover:bg-muted"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Picker principal ───────────────────────────────────────────── */
export function DateRangePicker() {
  const { filters, setRange } = useDashboard();
  const [open, setOpen] = useState(false);

  const [tempStart, setTempStart] = useState<Date | null>(filters.range.from);
  const [tempEnd, setTempEnd] = useState<Date | null>(filters.range.to);
  const [selecting, setSelecting] = useState(false);
  const [hover, setHover] = useState<Date | null>(null);
  const [modeLabel, setModeLabel] = useState("Fijo");

  const [startView, setStartView] = useState({ y: filters.range.from.getFullYear(), m: filters.range.from.getMonth() });
  const [endView, setEndView] = useState({ y: filters.range.to.getFullYear(), m: filters.range.to.getMonth() });

  useEffect(() => {
    if (open) {
      setTempStart(filters.range.from);
      setTempEnd(filters.range.to);
      setSelecting(false);
      setHover(null);
      setModeLabel("Fijo");
      setStartView({ y: filters.range.from.getFullYear(), m: filters.range.from.getMonth() });
      setEndView({ y: filters.range.to.getFullYear(), m: filters.range.to.getMonth() });
    }
  }, [open, filters.range]);

  const navMonth = (which: "start" | "end", dir: number) => {
    const v = which === "start" ? startView : endView;
    let m = v.m + dir;
    let y = v.y;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    (which === "start" ? setStartView : setEndView)({ y, m });
  };

  const onPick = (d: Date) => {
    if (!selecting) {
      setTempStart(d);
      setTempEnd(null);
      setSelecting(true);
    } else {
      if (tempStart && d < tempStart) {
        setTempEnd(tempStart);
        setTempStart(d);
      } else {
        setTempEnd(d);
      }
      setSelecting(false);
    }
  };

  const applyMode = (key: ModeKey, label: string) => {
    setModeLabel(label);
    if (key === "fixed") return;
    const r = rangeForMode(key);
    if (r) {
      setTempStart(r.s);
      setTempEnd(r.e);
      setSelecting(false);
      setStartView({ y: r.s.getFullYear(), m: r.s.getMonth() });
      setEndView({ y: r.e.getFullYear(), m: r.e.getMonth() });
    }
  };

  const apply = () => {
    if (tempStart && tempEnd) {
      const a = tempStart <= tempEnd ? tempStart : tempEnd;
      const b = tempStart <= tempEnd ? tempEnd : tempStart;
      setRange({ from: a, to: b });
      setOpen(false);
    } else if (tempStart) {
      setRange({ from: tempStart, to: tempStart });
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] font-semibold text-foreground">Elegir Período</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex min-w-[210px] cursor-pointer items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-2.5 py-1 text-[11.5px] font-semibold text-[#374151] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#E5E7EB] text-center">
            <span className="tabular-nums">
              {fmtTrigger(filters.range.from)} - {fmtTrigger(filters.range.to)}
            </span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={6}
          className="w-auto min-w-[560px] rounded-lg border border-border bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
        >
          <div className="flex flex-col gap-3">
            {/* Mode selector top right */}
            <div className="flex justify-end">
              <ModeDropdown current={modeLabel} onPick={applyMode} />
            </div>

            <hr className="border-border" />

            {/* Calendars */}
            <div className="flex gap-5">
              <MonthGrid
                title="Fecha de inicio"
                year={startView.y}
                month={startView.m}
                start={tempStart}
                end={tempEnd}
                hover={selecting ? hover : null}
                onPrev={() => navMonth("start", -1)}
                onNext={() => navMonth("start", 1)}
                onPick={onPick}
                onHover={setHover}
              />
              <MonthGrid
                title="Fecha de finalización"
                year={endView.y}
                month={endView.m}
                start={tempStart}
                end={tempEnd}
                hover={selecting ? hover : null}
                onPrev={() => navMonth("end", -1)}
                onNext={() => navMonth("end", 1)}
                onPick={onPick}
                onHover={setHover}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setOpen(false)}
                className="rounded px-4 py-1.5 text-[13px] font-medium text-[#b8860b] hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={apply}
                disabled={!tempStart}
                className="rounded bg-[#e8a900] px-5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#d49800] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Aplicar
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
