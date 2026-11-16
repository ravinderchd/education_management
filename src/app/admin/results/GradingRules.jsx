"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Settings2 } from "lucide-react";
import { useServerAction } from "@/components/ui/useServerAction";
import { GradeBadge } from "@/components/ui";
import { saveGradingRules } from "./actions";

/** Shows the grading scale. Admins can edit it. */
export default function GradingRules({ rules, canEdit }) {
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState(rules);
  const { pending, run } = useServerAction();

  const update = (i, field, value) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [field]: value } : row)));

  return (
    <aside className="card h-fit">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Settings2 className="h-4 w-4 text-slate-400" /> Grading rules
        </h2>
        {canEdit && !editing && (
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700" onClick={() => { setRows(rules); setEditing(true); }}>
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        <div className="p-5">
          <table className="w-full text-sm">
            <tbody>
              {rules.map((r, i) => {
                const upper = i === 0 ? 100 : Number(rules[i - 1].min_percentage) - 0.01;
                return (
                  <tr key={r.grade}>
                    <td className="py-1.5">
                      <GradeBadge grade={r.grade} />
                    </td>
                    <td className="py-1.5 text-right text-slate-600">
                      {Number(r.min_percentage)}% – {i === 0 ? 100 : upper.toFixed(2).replace(/\.00$/, "")}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-slate-500">Percentage = Marks ÷ Maximum marks × 100</p>
        </div>
      ) : (
        <form
          className="space-y-2 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            run(saveGradingRules, rows, { onSuccess: () => setEditing(false) });
          }}
        >
          <div className="grid grid-cols-[1fr_1fr_32px] gap-2 text-xs font-medium text-slate-500">
            <span>Grade</span>
            <span>Min %</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_32px] items-center gap-2">
              <input className="input py-1.5" value={r.grade} maxLength={3} required onChange={(e) => update(i, "grade", e.target.value)} />
              <input
                className="input py-1.5"
                type="number"
                min={0}
                max={100}
                step="0.01"
                required
                value={r.min_percentage}
                onChange={(e) => update(i, "min_percentage", e.target.value)}
              />
              <button type="button" className="icon-btn hover:!text-red-600" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label="Remove grade">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" className="flex items-center gap-1 pt-1 text-sm font-medium text-blue-600" onClick={() => setRows((rs) => [...rs, { grade: "", min_percentage: "" }])}>
            <Plus className="h-4 w-4" /> Add grade
          </button>
          <div className="flex gap-2 pt-3">
            <button type="button" className="btn-secondary btn-sm flex-1" onClick={() => setEditing(false)} disabled={pending}>
              Cancel
            </button>
            <button className="btn-primary btn-sm flex-1" disabled={pending}>
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
            </button>
          </div>
          <p className="pt-1 text-xs text-slate-500">Saving re-grades all existing results.</p>
        </form>
      )}
    </aside>
  );
}
