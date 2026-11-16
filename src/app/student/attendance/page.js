import { CalendarCheck, CheckCircle2, XCircle } from "lucide-react";
import { getMyStudent } from "@/lib/student";
import { PageHeader, Section, StatCard, EmptyState } from "@/components/ui";
import AttendanceSummary from "@/components/academic/AttendanceSummary";
import NoStudentRecord from "@/components/academic/NoStudentRecord";
import { MIN_ATTENDANCE, overallAttendance } from "@/lib/academics";
import { formatDate } from "@/lib/format";

export const metadata = { title: "My Attendance" };

export default async function MyAttendance() {
  const { supabase, student } = await getMyStudent();
  if (!student) {
    return (
      <>
        <PageHeader title="My Attendance" />
        <NoStudentRecord />
      </>
    );
  }

  const [{ data: subjects }, { data: records }] = await Promise.all([
    supabase.from("subjects").select("id, subject_name, subject_code").eq("course_id", student.course_id).order("semester").order("subject_name"),
    supabase
      .from("attendance")
      .select("id, subject_id, date, status, subject:subjects(subject_name)")
      .eq("student_id", student.id)
      .order("date", { ascending: false }),
  ]);

  const all = records || [];
  const overall = overallAttendance(all);

  return (
    <>
      <PageHeader title="My Attendance" subtitle="Attendance % = (Present classes ÷ Total classes) × 100" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarCheck}
          label="Overall attendance"
          value={`${overall.percentage}%`}
          hint={overall.total && overall.percentage < MIN_ATTENDANCE ? `Below the required ${MIN_ATTENDANCE}%` : `Required: ${MIN_ATTENDANCE}%`}
          tone={overall.total && overall.percentage < MIN_ATTENDANCE ? "red" : "blue"}
        />
        <StatCard icon={CheckCircle2} label="Classes attended" value={overall.present} tone="green" />
        <StatCard icon={XCircle} label="Classes missed" value={overall.total - overall.present} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Section title="By subject" className="xl:col-span-3" bodyClassName="">
          <AttendanceSummary subjects={subjects || []} records={all} />
        </Section>

        <Section title="Recent classes" className="xl:col-span-2" bodyClassName="">
          {all.length ? (
            <div className="max-h-[480px] overflow-y-auto">
              <table className="table">
                <tbody>
                  {all.slice(0, 50).map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap text-slate-500">{formatDate(r.date)}</td>
                      <td className="font-medium text-slate-800">{r.subject?.subject_name}</td>
                      <td className="text-right">
                        {r.status === "present" ? (
                          <span className="badge bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Present
                          </span>
                        ) : (
                          <span className="badge bg-red-50 text-red-700">
                            <XCircle className="h-3 w-3" /> Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={CalendarCheck} title="No attendance recorded yet" />
          )}
        </Section>
      </div>
    </>
  );
}
