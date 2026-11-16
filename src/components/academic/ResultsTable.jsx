import { FileBarChart } from "lucide-react";
import { EmptyState, GradeBadge } from "@/components/ui";
import { marksPercentage, summarizeResults } from "@/lib/academics";

/**
 * Marks table with total, percentage and overall grade.
 * results: [{ id, marks, total_marks, grade, published, subject: { subject_name, subject_code, semester } }]
 * rules:   grading rules from the database
 */
export default function ResultsTable({ results, rules, showStatus = false }) {
  if (!results.length) {
    return <EmptyState icon={FileBarChart} title="No results yet" message="Marks appear here once they are published." />;
  }

  const total = summarizeResults(results, rules);
  const rows = [...results].sort(
    (a, b) => (a.subject?.semester ?? 0) - (b.subject?.semester ?? 0) || (a.subject?.subject_name ?? "").localeCompare(b.subject?.subject_name ?? "")
  );

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Subject</th>
            <th className="text-center">Semester</th>
            <th className="text-right">Marks</th>
            <th className="text-right">Percentage</th>
            <th className="text-center">Grade</th>
            {showStatus && <th className="text-center">Status</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <p className="font-medium text-slate-900">{r.subject?.subject_name}</p>
                {r.subject?.subject_code && <p className="text-xs text-slate-500">{r.subject.subject_code}</p>}
              </td>
              <td className="text-center">{r.subject?.semester}</td>
              <td className="text-right font-medium">
                {Number(r.marks)} / {Number(r.total_marks)}
              </td>
              <td className="text-right">{marksPercentage(r.marks, r.total_marks)}%</td>
              <td className="text-center">
                <GradeBadge grade={r.grade} />
              </td>
              {showStatus && (
                <td className="text-center">
                  {r.published ? (
                    <span className="badge bg-emerald-50 text-emerald-700">Published</span>
                  ) : (
                    <span className="badge bg-amber-50 text-amber-700">Draft</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 font-semibold text-slate-900">
            <td className="px-4 py-3">Total</td>
            <td />
            <td className="px-4 py-3 text-right">
              {total.obtained} / {total.maximum}
            </td>
            <td className="px-4 py-3 text-right">{total.percentage}%</td>
            <td className="px-4 py-3 text-center">
              <GradeBadge grade={total.grade} />
            </td>
            {showStatus && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
