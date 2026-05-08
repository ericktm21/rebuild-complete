import { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiTone = "neutral" | "good" | "bad" | "warn";

interface Props {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: number;
  deltaIsGood?: (d: number) => boolean;
  icon?: ReactNode;
  hint?: string;
  tone?: KpiTone;
  spark?: number[];
}

const toneAccent: Record<KpiTone, string> = {
  neutral: "bg-primary",
  good: "bg-success",
  bad: "bg-destructive",
  warn: "bg-warning",
};

function Sparkline({ data, tone = "neutral" }: { data: number[]; tone?: KpiTone }) {
  if (!data || data.length < 2) return null;
  const w = 80, h = 24;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  const stroke =
    tone === "bad" ? "hsl(var(--destructive))"
    : tone === "good" ? "hsl(var(--success))"
    : tone === "warn" ? "hsl(var(--warning))"
    : "hsl(var(--primary))";
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function KpiCard({ label, value, unit, delta, deltaIsGood, icon, hint, tone = "neutral", spark }: Props) {
  const hasDelta = typeof delta === "number" && isFinite(delta);
  const good = hasDelta ? (deltaIsGood ? deltaIsGood(delta!) : delta! >= 0) : true;
  const Arrow = !hasDelta ? Minus : delta! > 0 ? ArrowUp : delta! < 0 ? ArrowDown : Minus;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-xs transition-base hover:shadow-card">
      <span className={cn("absolute inset-x-0 top-0 h-px", toneAccent[tone])} />
      <div className="flex items-start justify-between px-3.5 pt-3">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-muted-foreground/60">{icon}</span>}
          <span className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </span>
        </div>
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1 py-px text-[10px] font-semibold tabular",
              good ? "bg-success/8 text-success" : "bg-destructive/8 text-destructive",
            )}
          >
            <Arrow className="h-2.5 w-2.5" strokeWidth={2.5} />
            {Math.abs(delta!).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2 px-3.5 pb-3 pt-1.5">
        <div className="flex items-baseline gap-1">
          <span className="font-serif-display text-[28px] leading-none text-foreground tabular">{value}</span>
          {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
        </div>
        {spark && <Sparkline data={spark} tone={tone} />}
      </div>
      {hint && (
        <div className="border-t bg-secondary/40 px-3.5 py-1.5 text-[10.5px] text-muted-foreground">
          {hint}
        </div>
      )}
    </div>
  );
}
