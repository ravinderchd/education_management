"use client";

import { useState } from "react";
import { Check, X, Save, Loader2, Info, Users } from "lucide-react";
import { useServerAction } from "@/components/ui/useServerAction";
import { Avatar, EmptyState } from "@/components/ui";
import { MIN_ATTENDANCE } from "@/lib/academics";
import { formatDate } from "@/lib/format";
import { saveAttendance } from "./actions";

export default function AttendanceSheet({ sheet, date }) {
  const [statuses, setStatuses] = useState(() => Object.fromEntries(sheet.students.map((s) => [s.id, s.status])));
  const { pending, run } = useServerAction();

  const setAll = (status) => setStatuses(Object.fromEntries(sheet.students.map((s) => [s.id, status])));
  const presentCount = Object.values(statuses).filter((s) => s === "present").length;

  if (!sheet.students.length) {
    return (
      <div className="card">
        <EmptyState icon={Users} title="No students enrolled" message="No students are enrolled in this course and semester yet." />
      </div>
    );
  }

  function save() {
    run(saveAttendance, {
      subjectId: sheet.subject.id,
      date,
      records: sheet.students.map((s) => ({ studentId: s.id, status: statuses[s.id] })),
    });
  }

  return (
    <div className="card">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">
            {sheet.subject.subject_name}
            {sheet.subject.subject_code && <span className="ml-2 badge bg-blue-50 text-blue-700">{sheet.subject.subject_code}</span>}
          </h2>
          <p className="text-sm text-slate-500">
            {formatDate(date)} · {sheet.students.length} students · {sheet.classesHeld} classes held so far
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary btn-sm" onClick={() => setAll("present")}>
            Mark all present
          </button>
          <button className="btn-secondary btn-sm" onClick={() => setAll("absent")}>
            Mark all absent
          </button>
        </div>
      </div>

      {sheet.alreadySaved && (
        <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Info className="h-4 w-4 shrink-0" />
          Attendance for this date was already saved. Saving again will update it (no duplicate entries are created).
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Roll No.</th>
              <th>Student</th>
              <th className="text-center">Status</th>
              <th className="hidden text-right sm:table-cell">Attendance so far</th>
            </tr>
          </thead>
          <tbody>
            {sheet.students.map((s) => {
              const status = statuses[s.id];
              const low = s.summary.total > 0 && s.summary.percentage < MIN_ATTENDANCE;
              return (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.roll}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" />
                      <span className="font-medium text-slate-900">{s.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex justify-center gap-2" role="radiogroup" aria-label={`Attendance for ${s.name}`}>
                      <StatusButton
                        active={status === "present"}
                        onClick={() => setStatuses((p) => ({ ...p, [s.id]: "present" }))}
                        tone="present"
                      />
                      <StatusButton
                        active={status === "absent"}
                        onClick={() => setStatuses((p) => ({ ...p, [s.id]: "absent" }))}
                        tone="absent"
                      />
                    </div>
                  </td>
                  <td className="hidden text-right sm:table-cell">
                    {s.summary.total ? (
                      <span className={low ? "font-semibold text-red-600" : "text-slate-700"}>
                        {s.summary.percentage}%{" "}
                        <span className="text-xs font-normal text-slate-400">
                          ({s.summary.present}/{s.summary.total})
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400">–</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          <b className="text-emerald-700">{presentCount} present</b> ·{" "}
          <b className="text-red-600">{sheet.students.length - presentCount} absent</b>
        </p>
        <button className="btn-primary" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Attendance
        </button>
      </div>
    </div>
  );
}

function StatusButton({ active, onClick, tone }) {
  const present = tone === "present";
  const activeClass = present
    ? "border-emerald-600 bg-emerald-600 text-white"
    : "border-red-600 bg-red-600 text-white";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? activeClass : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {present ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      {present ? "Present" : "Absent"}
    </button>
  );
}
