import { Inbox, Loader2 } from "lucide-react";
import { initials } from "@/lib/format";

/** Page title + subtitle, with optional buttons on the right. */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

const TONES = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-600",
};

/** Dashboard statistic card. `icon` is a Lucide icon component. */
export function StatCard({ icon: Icon, label, value, hint, tone = "blue" }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="truncate text-2xl font-bold text-slate-900">{value}</p>
        {hint && <p className="truncate text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

/** Card with a title row. */
export function Section({ title, action, children, className = "", bodyClassName = "p-5" }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = "Nothing here yet", message, children }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="font-medium text-slate-700">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/** Form field: label + input (the input is passed as children). */
export function Field({ label, children, className = "", hint }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Avatar({ name, size = "md" }) {
  const s = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  return (
    <div className={`${s} flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700`}>
      {initials(name)}
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      {label}
    </div>
  );
}

/** Coloured percentage bar. Red below `warnBelow`. */
export function ProgressBar({ value, warnBelow }) {
  const low = warnBelow !== undefined && value < warnBelow;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${low ? "bg-red-500" : "bg-blue-600"}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

const GRADE_TONES = { "A+": "bg-emerald-50 text-emerald-700", A: "bg-emerald-50 text-emerald-700", F: "bg-red-50 text-red-700" };
export function GradeBadge({ grade }) {
  return <span className={`badge ${GRADE_TONES[grade] || "bg-blue-50 text-blue-700"}`}>{grade}</span>;
}
