"use client";

import { useState } from "react";
import { Save, Send, Loader2, Users } from "lucide-react";
import { useServerAction } from "@/components/ui/useServerAction";
import { Avatar, EmptyState, GradeBadge } from "@/components/ui";
import { calculateGrade, marksPercentage } from "@/lib/academics";
import { saveResults } from "./actions";

export default function ResultsSheet({ sheet, rules }) {
  const max = sheet.subject.max_marks;
  const [marks, setMarks] = useState(() => Object.fromEntries(sheet.students.map((s) => [s.id, s.marks])));
  const { pending, run } = useServerAction();

  if (!sheet.students.length) {
    return (
      <div className="card">
        <EmptyState icon={Users} title="No students enrolled" message="No students are enrolled in this course and semester yet." />
      </div>
    );
  }

  const invalid = Object.values(marks).some((m) => m !== "" && (Number.isNaN(Number(m)) || Number(m) < 0 || Number(m) > max));

  function save(publish) {
    run(saveResults, {
      subjectId: sheet.subject.id,
      publish,
      entries: sheet.students.map((s) => ({ studentId: s.id, marks: marks[s.id] })),
    });
  }

  return (
    <div className="card">
      <div className="border-b border-slate-100 p-4">
        <h2 className="font-semibold text-slate-900">
          {sheet.subject.subject_name}
          {sheet.subject.subject_code && <span className="ml-2 badge bg-blue-50 text-blue-700">{sheet.subject.subject_code}</span>}
        </h2>
        <p className="text-sm text-slate-500">
          Maximum marks: {max} · Leave a box empty to skip that student
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Roll No.</th>
              <th>Student</th>
              <th className="w-36">Marks / {max}</th>
              <th className="text-right">Percentage</th>
              <th className="text-center">Grade</th>
              <th className="hidden text-center md:table-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {sheet.students.map((s) => {
              const value = marks[s.id];
              const hasValue = value !== "" && !Number.isNaN(Number(value));
              const tooHigh = hasValue && (Number(value) > max || Number(value) < 0);
              const pct = hasValue && !tooHigh ? marksPercentage(value, max) : null;
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
                    <input
                      type="number"
                      min={0}
                      max={max}
                      step="0.5"
                      inputMode="decimal"
                      aria-label={`Marks for ${s.name}`}
                      className={`input py-1.5 ${tooHigh ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                      value={value}
                      onChange={(e) => setMarks((p) => ({ ...p, [s.id]: e.target.value }))}
                    />
                    {tooHigh && <p className="mt-1 text-xs text-red-600">0 – {max} only</p>}
                  </td>
                  <td className="text-right">{pct !== null ? `${pct}%` : "–"}</td>
                  <td className="text-center">{pct !== null ? <GradeBadge grade={calculateGrade(pct, rules)} /> : "–"}</td>
                  <td className="hidden text-center md:table-cell">
                    {s.published === null ? (
                      <span className="text-xs text-slate-400">Not entered</span>
                    ) : s.published ? (
                      <span className="badge bg-emerald-50 text-emerald-700">Published</span>
                    ) : (
                      <span className="badge bg-amber-50 text-amber-700">Draft</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-end">
        <p className="mr-auto text-xs text-slate-500">Students only see marks after they are published.</p>
        <button className="btn-secondary" onClick={() => save(false)} disabled={pending || invalid}>
          <Save className="h-4 w-4" /> Save as draft
        </button>
        <button className="btn-primary" onClick={() => save(true)} disabled={pending || invalid}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Save &amp; publish
        </button>
      </div>
    </div>
  );
}
