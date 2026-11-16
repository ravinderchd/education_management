import { CalendarCheck } from "lucide-react";
import { EmptyState, ProgressBar } from "@/components/ui";
import { MIN_ATTENDANCE, summarizeAttendance } from "@/lib/academics";

/**
 * Attendance % per subject for one student.
 * subjects: [{ id, subject_name, subject_code }]
 * records:  [{ subject_id, status }]
 */
export default function AttendanceSummary({ subjects, records }) {
  const summary = summarizeAttendance(records);
  const rows = subjects.filter((s) => summary[s.id]);

  if (!rows.length) {
    return <EmptyState icon={CalendarCheck} title="No attendance recorded yet" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Subject</th>
            <th className="text-center">Present</th>
            <th className="text-center">Total</th>
            <th className="w-1/3">Attendance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const a = summary[s.id];
            const low = a.percentage < MIN_ATTENDANCE;
            return (
              <tr key={s.id}>
                <td>
                  <p className="font-medium text-slate-900">{s.subject_name}</p>
                  {s.subject_code && <p className="text-xs text-slate-500">{s.subject_code}</p>}
                </td>
                <td className="text-center">{a.present}</td>
                <td className="text-center">{a.total}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <ProgressBar value={a.percentage} warnBelow={MIN_ATTENDANCE} />
                    <span className={`w-14 text-right text-sm font-semibold ${low ? "text-red-600" : "text-slate-900"}`}>
                      {a.percentage}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        Attendance % = (Present classes ÷ Total classes) × 100. Minimum required: {MIN_ATTENDANCE}%.
      </p>
    </div>
  );
}
