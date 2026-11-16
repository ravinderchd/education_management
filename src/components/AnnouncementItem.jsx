import { Megaphone } from "lucide-react";
import { formatDate, AUDIENCE_LABELS } from "@/lib/format";

/** One announcement row – used on dashboards and the announcements pages. */
export default function AnnouncementItem({ announcement, compact = false, action }) {
  const a = announcement;
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Megaphone className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-slate-900">{a.title}</p>
          {action}
        </div>
        <p className={`mt-0.5 text-sm whitespace-pre-line text-slate-600 ${compact ? "line-clamp-2" : ""}`}>
          {a.description}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>{formatDate(a.date)}</span>
          {a.author?.name && <span>· {a.author.name}</span>}
          {!compact && <span className="badge bg-slate-100 text-slate-600">{AUDIENCE_LABELS[a.audience]}</span>}
        </div>
      </div>
    </div>
  );
}
